import { CodeInterpreter } from '@e2b/code-interpreter';

export interface E2BExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  logs: string[];
  artifacts?: Array<{
    name: string;
    url: string;
    type: 'image' | 'file' | 'chart';
  }>;
  executionTime?: number;
  memoryUsage?: number;
}

export interface E2BFile {
  name: string;
  content: string;
  path?: string;
  type?: 'python' | 'javascript' | 'typescript' | 'html' | 'css' | 'markdown' | 'json' | 'txt';
}

export interface E2BEnvironmentInfo {
  id: string;
  status: 'idle' | 'running' | 'stopped' | 'error';
  language: string;
  createdAt: Date;
  lastActivity: Date;
  filesCount: number;
  memoryUsage: number;
}

class E2BService {
  private apiKey: string;
  private activeInterpreters = new Map<string, CodeInterpreter>();
  private logs: string[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_E2B_API_KEY;
    if (!this.apiKey) {
      throw new Error('E2B API key is required. Please set VITE_E2B_API_KEY in your environment.');
    }
  }

  private addLog(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[E2B] ${message}`);
  }

  async createEnvironment(language: 'python' | 'nodejs' = 'python'): Promise<string> {
    try {
      this.addLog(`Creating new ${language} environment...`);
      
      const template = language === 'python' ? 'Python3' : 'Node.js';
      const interpreter = await CodeInterpreter.create({
        apiKey: this.apiKey,
        template,
      });

      const envId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.activeInterpreters.set(envId, interpreter);
      
      this.addLog(`Environment ${envId} created successfully`);
      return envId;
    } catch (error) {
      this.addLog(`Failed to create environment: ${error}`);
      throw new Error(`Failed to create E2B environment: ${error}`);
    }
  }

  async executeCode(
    envId: string, 
    code: string, 
    options: {
      timeout?: number;
      language?: 'python' | 'javascript' | 'typescript' | 'bash';
      installPackages?: string[];
    } = {}
  ): Promise<E2BExecutionResult> {
    const startTime = Date.now();
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found. Please create an environment first.`);
    }

    try {
      this.addLog(`Executing code in environment ${envId}...`);
      
      // Install packages if specified
      if (options.installPackages && options.installPackages.length > 0) {
        this.addLog(`Installing packages: ${options.installPackages.join(', ')}`);
        
        if (options.language === 'python' || !options.language) {
          for (const pkg of options.installPackages) {
            await interpreter.notebook.execCell(`!pip install ${pkg}`);
          }
        } else if (options.language === 'javascript' || options.language === 'typescript') {
          for (const pkg of options.installPackages) {
            await interpreter.notebook.execCell(`!npm install ${pkg}`);
          }
        }
      }

      // Execute the main code
      const result = await interpreter.notebook.execCell(code, {
        timeoutMs: options.timeout || 30000,
      });

      const executionTime = Date.now() - startTime;
      
      // Process artifacts (charts, images, files)
      const artifacts: Array<{name: string; url: string; type: 'image' | 'file' | 'chart'}> = [];
      
      if (result.results) {
        for (const cellResult of result.results) {
          if (cellResult.png) {
            artifacts.push({
              name: `chart_${Date.now()}.png`,
              url: cellResult.png,
              type: 'chart'
            });
          }
          if (cellResult.jpeg) {
            artifacts.push({
              name: `image_${Date.now()}.jpg`,
              url: cellResult.jpeg,
              type: 'image'
            });
          }
          if (cellResult.html) {
            // For HTML output, we could create a blob URL
            const blob = new Blob([cellResult.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            artifacts.push({
              name: `output_${Date.now()}.html`,
              url,
              type: 'file'
            });
          }
        }
      }

      const executionResult: E2BExecutionResult = {
        success: !result.error,
        output: result.text || '',
        error: result.error ? String(result.error) : undefined,
        logs: result.logs || [],
        artifacts,
        executionTime,
        memoryUsage: 0, // E2B doesn't provide memory usage directly
      };

      this.addLog(`Code execution completed in ${executionTime}ms`);
      return executionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addLog(`Code execution failed: ${error}`);
      
      return {
        success: false,
        error: String(error),
        logs: [String(error)],
        artifacts: [],
        executionTime,
      };
    }
  }

  async uploadFile(envId: string, file: E2BFile): Promise<boolean> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      this.addLog(`Uploading file ${file.name} to environment ${envId}...`);
      
      const filePath = file.path || `/tmp/${file.name}`;
      await interpreter.files.write(filePath, file.content);
      
      this.addLog(`File ${file.name} uploaded successfully`);
      return true;
    } catch (error) {
      this.addLog(`Failed to upload file ${file.name}: ${error}`);
      return false;
    }
  }

  async downloadFile(envId: string, filePath: string): Promise<string | null> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      this.addLog(`Downloading file ${filePath} from environment ${envId}...`);
      
      const content = await interpreter.files.read(filePath);
      this.addLog(`File ${filePath} downloaded successfully`);
      return content;
    } catch (error) {
      this.addLog(`Failed to download file ${filePath}: ${error}`);
      return null;
    }
  }

  async listFiles(envId: string, directory = '/tmp'): Promise<string[]> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      const files = await interpreter.files.list(directory);
      return files.map(f => f.name);
    } catch (error) {
      this.addLog(`Failed to list files in ${directory}: ${error}`);
      return [];
    }
  }

  async createFile(envId: string, filePath: string, content: string): Promise<boolean> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      await interpreter.files.write(filePath, content);
      this.addLog(`File ${filePath} created successfully`);
      return true;
    } catch (error) {
      this.addLog(`Failed to create file ${filePath}: ${error}`);
      return false;
    }
  }

  async deleteFile(envId: string, filePath: string): Promise<boolean> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      await interpreter.files.remove(filePath);
      this.addLog(`File ${filePath} deleted successfully`);
      return true;
    } catch (error) {
      this.addLog(`Failed to delete file ${filePath}: ${error}`);
      return false;
    }
  }

  async installPackage(envId: string, packageName: string, language: 'python' | 'javascript' = 'python'): Promise<boolean> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      throw new Error(`Environment ${envId} not found`);
    }

    try {
      this.addLog(`Installing ${language} package: ${packageName}`);
      
      const installCommand = language === 'python' 
        ? `!pip install ${packageName}`
        : `!npm install ${packageName}`;
      
      const result = await interpreter.notebook.execCell(installCommand);
      
      if (result.error) {
        this.addLog(`Failed to install ${packageName}: ${result.error}`);
        return false;
      }
      
      this.addLog(`Package ${packageName} installed successfully`);
      return true;
    } catch (error) {
      this.addLog(`Failed to install package ${packageName}: ${error}`);
      return false;
    }
  }

  async getEnvironmentInfo(envId: string): Promise<E2BEnvironmentInfo | null> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      return null;
    }

    try {
      const files = await interpreter.files.list('/tmp');
      
      return {
        id: envId,
        status: 'running',
        language: 'python', // This could be dynamic based on environment
        createdAt: new Date(), // This should be tracked when creating
        lastActivity: new Date(),
        filesCount: files.length,
        memoryUsage: 0, // E2B doesn't provide this directly
      };
    } catch (error) {
      this.addLog(`Failed to get environment info: ${error}`);
      return {
        id: envId,
        status: 'error',
        language: 'python',
        createdAt: new Date(),
        lastActivity: new Date(),
        filesCount: 0,
        memoryUsage: 0,
      };
    }
  }

  async listEnvironments(): Promise<E2BEnvironmentInfo[]> {
    const environments: E2BEnvironmentInfo[] = [];
    
    for (const [envId] of this.activeInterpreters) {
      const info = await this.getEnvironmentInfo(envId);
      if (info) {
        environments.push(info);
      }
    }
    
    return environments;
  }

  async closeEnvironment(envId: string): Promise<boolean> {
    const interpreter = this.activeInterpreters.get(envId);
    
    if (!interpreter) {
      return false;
    }

    try {
      this.addLog(`Closing environment ${envId}...`);
      await interpreter.close();
      this.activeInterpreters.delete(envId);
      this.addLog(`Environment ${envId} closed successfully`);
      return true;
    } catch (error) {
      this.addLog(`Failed to close environment ${envId}: ${error}`);
      return false;
    }
  }

  async closeAllEnvironments(): Promise<void> {
    this.addLog('Closing all active environments...');
    
    const promises = Array.from(this.activeInterpreters.keys()).map(envId => 
      this.closeEnvironment(envId)
    );
    
    await Promise.all(promises);
    this.addLog('All environments closed');
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Advanced features
  async runDataAnalysis(envId: string, data: any[], analysisType: 'summary' | 'visualization' | 'correlation'): Promise<E2BExecutionResult> {
    const code = this.generateDataAnalysisCode(data, analysisType);
    return this.executeCode(envId, code, {
      installPackages: ['pandas', 'matplotlib', 'seaborn', 'numpy'],
      language: 'python'
    });
  }

  private generateDataAnalysisCode(data: any[], analysisType: 'summary' | 'visualization' | 'correlation'): string {
    const dataJson = JSON.stringify(data);
    
    switch (analysisType) {
      case 'summary':
        return `
import pandas as pd
import json

# Load data
data = json.loads('${dataJson}')
df = pd.DataFrame(data)

# Generate summary statistics
print("Dataset Overview:")
print(f"Shape: {df.shape}")
print("\\nData Types:")
print(df.dtypes)
print("\\nSummary Statistics:")
print(df.describe())
print("\\nMissing Values:")
print(df.isnull().sum())
`;

      case 'visualization':
        return `
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Load data
data = json.loads('${dataJson}')
df = pd.DataFrame(data)

# Create visualizations
plt.figure(figsize=(12, 8))

# Numeric columns histogram
numeric_cols = df.select_dtypes(include=['number']).columns
if len(numeric_cols) > 0:
    plt.subplot(2, 2, 1)
    df[numeric_cols].hist(alpha=0.7)
    plt.title('Distribution of Numeric Columns')

# Correlation heatmap
if len(numeric_cols) > 1:
    plt.subplot(2, 2, 2)
    sns.heatmap(df[numeric_cols].corr(), annot=True, cmap='coolwarm')
    plt.title('Correlation Matrix')

plt.tight_layout()
plt.show()
`;

      case 'correlation':
        return `
import pandas as pd
import numpy as np
import json

# Load data
data = json.loads('${dataJson}')
df = pd.DataFrame(data)

# Calculate correlations
numeric_df = df.select_dtypes(include=['number'])
if len(numeric_df.columns) > 1:
    correlation_matrix = numeric_df.corr()
    print("Correlation Matrix:")
    print(correlation_matrix)
    
    # Find strongest correlations
    correlations = []
    for i in range(len(correlation_matrix.columns)):
        for j in range(i+1, len(correlation_matrix.columns)):
            col1 = correlation_matrix.columns[i]
            col2 = correlation_matrix.columns[j]
            corr = correlation_matrix.iloc[i, j]
            correlations.append((col1, col2, corr))
    
    correlations.sort(key=lambda x: abs(x[2]), reverse=True)
    
    print("\\nStrongest Correlations:")
    for col1, col2, corr in correlations[:5]:
        print(f"{col1} - {col2}: {corr:.3f}")
else:
    print("Not enough numeric columns for correlation analysis")
`;

      default:
        return 'print("Invalid analysis type")';
    }
  }

  async runWebScraping(envId: string, url: string, selector?: string): Promise<E2BExecutionResult> {
    const code = `
import requests
from bs4 import BeautifulSoup
import json

try:
    # Fetch the webpage
    response = requests.get('${url}')
    response.raise_for_status()
    
    # Parse HTML
    soup = BeautifulSoup(response.content, 'html.parser')
    
    ${selector ? `
    # Extract specific elements
    elements = soup.select('${selector}')
    results = [elem.get_text().strip() for elem in elements]
    print(f"Found {len(results)} elements:")
    for i, result in enumerate(results[:10]):  # Show first 10
        print(f"{i+1}. {result}")
    ` : `
    # Extract basic information
    title = soup.find('title')
    print(f"Page Title: {title.get_text() if title else 'No title found'}")
    
    # Extract all text content
    text_content = soup.get_text()
    word_count = len(text_content.split())
    print(f"Word Count: {word_count}")
    
    # Extract links
    links = soup.find_all('a', href=True)
    print(f"Number of Links: {len(links)}")
    `}
    
except Exception as e:
    print(f"Error: {str(e)}")
`;

    return this.executeCode(envId, code, {
      installPackages: ['requests', 'beautifulsoup4'],
      language: 'python'
    });
  }

  async runMLModel(envId: string, modelType: 'linear_regression' | 'classification' | 'clustering', data: any[]): Promise<E2BExecutionResult> {
    const dataJson = JSON.stringify(data);
    
    const code = `
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import json
import matplotlib.pyplot as plt

# Load data
data = json.loads('${dataJson}')
df = pd.DataFrame(data)
print(f"Dataset shape: {df.shape}")

${this.generateMLCode(modelType)}
`;

    return this.executeCode(envId, code, {
      installPackages: ['scikit-learn', 'pandas', 'numpy', 'matplotlib'],
      language: 'python'
    });
  }

  private generateMLCode(modelType: 'linear_regression' | 'classification' | 'clustering'): string {
    switch (modelType) {
      case 'linear_regression':
        return `
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# Prepare data (assuming last column is target)
X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Evaluate
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Squared Error: {mse:.4f}")
print(f"R² Score: {r2:.4f}")

# Plot results
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.7)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Linear Regression: Actual vs Predicted')
plt.show()
`;

      case 'classification':
        return `
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# Prepare data (assuming last column is target)
X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Evaluate
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.show()

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\\nFeature Importance:")
print(feature_importance)
`;

      case 'clustering':
        return `
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Prepare data
X = df.select_dtypes(include=['number'])

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Determine optimal number of clusters
inertias = []
silhouette_scores = []
k_range = range(2, min(11, len(X)))

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(X_scaled, kmeans.labels_))

# Plot elbow curve
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(k_range, inertias, 'bo-')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Inertia')
plt.title('Elbow Method')

plt.subplot(1, 2, 2)
plt.plot(k_range, silhouette_scores, 'ro-')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Silhouette Score')
plt.title('Silhouette Analysis')

plt.tight_layout()
plt.show()

# Use optimal k (highest silhouette score)
optimal_k = k_range[np.argmax(silhouette_scores)]
print(f"Optimal number of clusters: {optimal_k}")

# Final clustering
kmeans = KMeans(n_clusters=optimal_k, random_state=42)
clusters = kmeans.fit_predict(X_scaled)

print(f"Silhouette Score: {silhouette_score(X_scaled, clusters):.4f}")
print(f"Cluster distribution: {np.bincount(clusters)}")
`;

      default:
        return 'print("Invalid model type")';
    }
  }
}

// Create singleton instance
const e2bService = new E2BService();
export default e2bService;