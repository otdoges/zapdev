'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Table, 
  Plus, 
  Play, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface DatabaseTable {
  name: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    foreignKey?: string;
  }[];
  rowCount: number;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowsAffected?: number;
  error?: string;
  executionTime: number;
}

interface DatabaseExplorerProps {
  className?: string;
}

export default function DatabaseExplorer({ className = '' }: DatabaseExplorerProps) {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(false);
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status');
      if (response.ok) {
        const data = await response.json();
        setDatabaseInitialized(data.initialized);
        if (data.initialized) {
          loadTables();
        }
      }
    } catch (error) {
      console.error('Failed to check database status:', error);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/database/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setDatabaseInitialized(true);
        await loadTables();
      } else {
        const error = await response.json();
        console.error('Database initialization failed:', error);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch('/api/database/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const executeQuery = async () => {
    if (!queryInput.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryInput.trim() })
      });

      const executionTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        setQueryResult({
          ...data,
          executionTime
        });
        
        // Add to query history
        setQueryHistory(prev => [queryInput.trim(), ...prev.slice(0, 9)]); // Keep last 10 queries
        
        // Refresh tables if it was a DDL statement
        if (queryInput.toLowerCase().includes('create table') || 
            queryInput.toLowerCase().includes('drop table') ||
            queryInput.toLowerCase().includes('alter table')) {
          await loadTables();
        }
      } else {
        setQueryResult({
          columns: [],
          rows: [],
          error: data.error,
          executionTime
        });
      }
    } catch (error) {
      setQueryResult({
        columns: [],
        rows: [],
        error: error instanceof Error ? error.message : 'Query execution failed',
        executionTime: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTableData = (tableName: string) => {
    setQueryInput(`SELECT * FROM ${tableName} LIMIT 100;`);
    setSelectedTable(tableName);
  };

  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const insertSampleQueries = () => {
    const samples = [
      'SELECT * FROM users WHERE created_at > datetime("now", "-7 days");',
      'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price DECIMAL(10,2));',
      'INSERT INTO users (name, email) VALUES ("John Doe", "john@example.com");',
      'UPDATE users SET last_login = datetime("now") WHERE id = 1;'
    ];
    
    setQueryInput(samples.join('\n\n'));
  };

  if (!databaseInitialized) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-900 text-white rounded-lg border border-gray-700 ${className}`}>
        <Database className="w-16 h-16 text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Initialize SQLite Database</h3>
        <p className="text-gray-300 mb-6 text-center">
          Create a SQLite database in your E2B sandbox with Drizzle ORM integration.
          This will set up a complete database environment for your applications.
        </p>
        <Button 
          onClick={initializeDatabase}
          disabled={isInitializing}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isInitializing ? 'Initializing...' : 'Initialize Database'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-white">Database Explorer</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTables}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <Search className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={insertSampleQueries}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <Plus className="w-4 h-4" />
            Samples
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Tables Sidebar */}
        <div className="w-72 border-r border-gray-700 bg-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-medium text-gray-200 mb-2">Tables ({tables.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tables.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tables found</p>
                <p className="text-xs text-gray-500 mt-1">Create tables with SQL</p>
              </div>
            ) : (
              <div className="p-2">
                {tables.map((table) => (
                  <div key={table.name} className="mb-2">
                    <div
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        selectedTable === table.name ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      onClick={() => loadTableData(table.name)}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTableExpansion(table.name);
                          }}
                          className="p-0.5 hover:bg-gray-200 rounded"
                        >
                          {expandedTables.has(table.name) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <Table className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{table.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                        {table.rowCount}
                      </span>
                    </div>
                    
                    {expandedTables.has(table.name) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {table.columns.map((column) => (
                          <div key={column.name} className="text-xs text-gray-300 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              column.primaryKey ? 'bg-yellow-400' : 
                              column.foreignKey ? 'bg-green-400' : 'bg-gray-300'
                            }`} />
                            <span className="font-mono">{column.name}</span>
                            <span className="text-gray-500">{column.type}</span>
                            {!column.nullable && <span className="text-red-500">*</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Query Input */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-200">SQL Query</label>
              <div className="flex gap-2">
                {queryHistory.length > 0 && (
                  <select
                    className="text-xs border border-gray-600 bg-gray-700 text-white rounded px-2 py-1"
                    onChange={(e) => e.target.value && setQueryInput(e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Query History</option>
                    {queryHistory.map((query, index) => (
                      <option key={index} value={query}>
                        {query.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  onClick={executeQuery}
                  disabled={isExecuting || !queryInput.trim()}
                  size="sm"
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="w-4 h-4" />
                  {isExecuting ? 'Executing...' : 'Run'}
                </Button>
              </div>
            </div>
            <Textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter SQL query (e.g., SELECT * FROM users WHERE name LIKE '%john%')"
              className="font-mono text-sm resize-none bg-gray-700 text-white border-gray-600 placeholder-gray-400"
              rows={4}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  executeQuery();
                }
              }}
            />
            <div className="text-xs text-gray-400 mt-1">
              Press Ctrl/Cmd + Enter to execute
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 p-4 overflow-hidden">
            {queryResult && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>Execution time: {queryResult.executionTime}ms</span>
                    {queryResult.rows.length > 0 && (
                      <span>Rows: {queryResult.rows.length}</span>
                    )}
                    {queryResult.rowsAffected !== undefined && (
                      <span>Affected: {queryResult.rowsAffected}</span>
                    )}
                  </div>
                </div>

                {queryResult.error ? (
                  <div className="bg-red-900/20 border border-red-600 rounded p-4">
                    <h4 className="font-medium text-red-400 mb-2">Query Error</h4>
                    <pre className="text-sm text-red-300 whitespace-pre-wrap">
                      {queryResult.error}
                    </pre>
                  </div>
                ) : queryResult.rows.length > 0 ? (
                  <div className="flex-1 overflow-auto border border-gray-600 rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          {queryResult.columns.map((column) => (
                            <th key={column} className="text-left p-3 font-medium text-gray-200 border-b border-gray-600">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-800 border-b border-gray-700">
                            {queryResult.columns.map((column) => (
                              <td key={column} className="p-3 font-mono text-xs max-w-xs truncate text-gray-300">
                                {row[column] === null ? (
                                  <span className="text-gray-500 italic">NULL</span>
                                ) : (
                                  String(row[column])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-300">Query executed successfully</p>
                      {queryResult.rowsAffected !== undefined && (
                        <p className="text-sm mt-1 text-gray-400">{queryResult.rowsAffected} rows affected</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}