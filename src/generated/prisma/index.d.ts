
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Fragment
 * 
 */
export type Fragment = $Result.DefaultSelection<Prisma.$FragmentPayload>
/**
 * Model FragmentDraft
 * 
 */
export type FragmentDraft = $Result.DefaultSelection<Prisma.$FragmentDraftPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model Project
 * 
 */
export type Project = $Result.DefaultSelection<Prisma.$ProjectPayload>
/**
 * Model Usage
 * 
 */
export type Usage = $Result.DefaultSelection<Prisma.$UsagePayload>
/**
 * Model Attachment
 * 
 */
export type Attachment = $Result.DefaultSelection<Prisma.$AttachmentPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Framework: {
  NEXTJS: 'NEXTJS',
  ANGULAR: 'ANGULAR',
  REACT: 'REACT',
  VUE: 'VUE',
  SVELTE: 'SVELTE'
};

export type Framework = (typeof Framework)[keyof typeof Framework]


export const MessageRole: {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT'
};

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole]


export const MessageType: {
  RESULT: 'RESULT',
  ERROR: 'ERROR',
  STREAMING: 'STREAMING'
};

export type MessageType = (typeof MessageType)[keyof typeof MessageType]


export const MessageStatus: {
  PENDING: 'PENDING',
  STREAMING: 'STREAMING',
  COMPLETE: 'COMPLETE'
};

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus]


export const AttachmentType: {
  IMAGE: 'IMAGE'
};

export type AttachmentType = (typeof AttachmentType)[keyof typeof AttachmentType]

}

export type Framework = $Enums.Framework

export const Framework: typeof $Enums.Framework

export type MessageRole = $Enums.MessageRole

export const MessageRole: typeof $Enums.MessageRole

export type MessageType = $Enums.MessageType

export const MessageType: typeof $Enums.MessageType

export type MessageStatus = $Enums.MessageStatus

export const MessageStatus: typeof $Enums.MessageStatus

export type AttachmentType = $Enums.AttachmentType

export const AttachmentType: typeof $Enums.AttachmentType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Fragments
 * const fragments = await prisma.fragment.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Fragments
   * const fragments = await prisma.fragment.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.fragment`: Exposes CRUD operations for the **Fragment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Fragments
    * const fragments = await prisma.fragment.findMany()
    * ```
    */
  get fragment(): Prisma.FragmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.fragmentDraft`: Exposes CRUD operations for the **FragmentDraft** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FragmentDrafts
    * const fragmentDrafts = await prisma.fragmentDraft.findMany()
    * ```
    */
  get fragmentDraft(): Prisma.FragmentDraftDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.project`: Exposes CRUD operations for the **Project** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Projects
    * const projects = await prisma.project.findMany()
    * ```
    */
  get project(): Prisma.ProjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.usage`: Exposes CRUD operations for the **Usage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Usages
    * const usages = await prisma.usage.findMany()
    * ```
    */
  get usage(): Prisma.UsageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.attachment`: Exposes CRUD operations for the **Attachment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Attachments
    * const attachments = await prisma.attachment.findMany()
    * ```
    */
  get attachment(): Prisma.AttachmentDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.18.0
   * Query Engine version: 34b5a692b7bd79939a9a2c3ef97d816e749cda2f
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Fragment: 'Fragment',
    FragmentDraft: 'FragmentDraft',
    Message: 'Message',
    Project: 'Project',
    Usage: 'Usage',
    Attachment: 'Attachment'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "fragment" | "fragmentDraft" | "message" | "project" | "usage" | "attachment"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Fragment: {
        payload: Prisma.$FragmentPayload<ExtArgs>
        fields: Prisma.FragmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FragmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FragmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          findFirst: {
            args: Prisma.FragmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FragmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          findMany: {
            args: Prisma.FragmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>[]
          }
          create: {
            args: Prisma.FragmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          createMany: {
            args: Prisma.FragmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FragmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>[]
          }
          delete: {
            args: Prisma.FragmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          update: {
            args: Prisma.FragmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          deleteMany: {
            args: Prisma.FragmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FragmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FragmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>[]
          }
          upsert: {
            args: Prisma.FragmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentPayload>
          }
          aggregate: {
            args: Prisma.FragmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFragment>
          }
          groupBy: {
            args: Prisma.FragmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<FragmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.FragmentCountArgs<ExtArgs>
            result: $Utils.Optional<FragmentCountAggregateOutputType> | number
          }
        }
      }
      FragmentDraft: {
        payload: Prisma.$FragmentDraftPayload<ExtArgs>
        fields: Prisma.FragmentDraftFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FragmentDraftFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FragmentDraftFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          findFirst: {
            args: Prisma.FragmentDraftFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FragmentDraftFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          findMany: {
            args: Prisma.FragmentDraftFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>[]
          }
          create: {
            args: Prisma.FragmentDraftCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          createMany: {
            args: Prisma.FragmentDraftCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FragmentDraftCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>[]
          }
          delete: {
            args: Prisma.FragmentDraftDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          update: {
            args: Prisma.FragmentDraftUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          deleteMany: {
            args: Prisma.FragmentDraftDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FragmentDraftUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FragmentDraftUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>[]
          }
          upsert: {
            args: Prisma.FragmentDraftUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FragmentDraftPayload>
          }
          aggregate: {
            args: Prisma.FragmentDraftAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFragmentDraft>
          }
          groupBy: {
            args: Prisma.FragmentDraftGroupByArgs<ExtArgs>
            result: $Utils.Optional<FragmentDraftGroupByOutputType>[]
          }
          count: {
            args: Prisma.FragmentDraftCountArgs<ExtArgs>
            result: $Utils.Optional<FragmentDraftCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      Project: {
        payload: Prisma.$ProjectPayload<ExtArgs>
        fields: Prisma.ProjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findFirst: {
            args: Prisma.ProjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findMany: {
            args: Prisma.ProjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          create: {
            args: Prisma.ProjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          createMany: {
            args: Prisma.ProjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          delete: {
            args: Prisma.ProjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          update: {
            args: Prisma.ProjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          deleteMany: {
            args: Prisma.ProjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          upsert: {
            args: Prisma.ProjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          aggregate: {
            args: Prisma.ProjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProject>
          }
          groupBy: {
            args: Prisma.ProjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectCountAggregateOutputType> | number
          }
        }
      }
      Usage: {
        payload: Prisma.$UsagePayload<ExtArgs>
        fields: Prisma.UsageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UsageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UsageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          findFirst: {
            args: Prisma.UsageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UsageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          findMany: {
            args: Prisma.UsageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>[]
          }
          create: {
            args: Prisma.UsageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          createMany: {
            args: Prisma.UsageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UsageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>[]
          }
          delete: {
            args: Prisma.UsageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          update: {
            args: Prisma.UsageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          deleteMany: {
            args: Prisma.UsageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UsageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UsageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>[]
          }
          upsert: {
            args: Prisma.UsageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsagePayload>
          }
          aggregate: {
            args: Prisma.UsageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUsage>
          }
          groupBy: {
            args: Prisma.UsageGroupByArgs<ExtArgs>
            result: $Utils.Optional<UsageGroupByOutputType>[]
          }
          count: {
            args: Prisma.UsageCountArgs<ExtArgs>
            result: $Utils.Optional<UsageCountAggregateOutputType> | number
          }
        }
      }
      Attachment: {
        payload: Prisma.$AttachmentPayload<ExtArgs>
        fields: Prisma.AttachmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AttachmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AttachmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          findFirst: {
            args: Prisma.AttachmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AttachmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          findMany: {
            args: Prisma.AttachmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>[]
          }
          create: {
            args: Prisma.AttachmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          createMany: {
            args: Prisma.AttachmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AttachmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>[]
          }
          delete: {
            args: Prisma.AttachmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          update: {
            args: Prisma.AttachmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          deleteMany: {
            args: Prisma.AttachmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AttachmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AttachmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>[]
          }
          upsert: {
            args: Prisma.AttachmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentPayload>
          }
          aggregate: {
            args: Prisma.AttachmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAttachment>
          }
          groupBy: {
            args: Prisma.AttachmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<AttachmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.AttachmentCountArgs<ExtArgs>
            result: $Utils.Optional<AttachmentCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    fragment?: FragmentOmit
    fragmentDraft?: FragmentDraftOmit
    message?: MessageOmit
    project?: ProjectOmit
    usage?: UsageOmit
    attachment?: AttachmentOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type MessageCountOutputType
   */

  export type MessageCountOutputType = {
    Attachment: number
  }

  export type MessageCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Attachment?: boolean | MessageCountOutputTypeCountAttachmentArgs
  }

  // Custom InputTypes
  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageCountOutputType
     */
    select?: MessageCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountAttachmentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AttachmentWhereInput
  }


  /**
   * Count Type ProjectCountOutputType
   */

  export type ProjectCountOutputType = {
    Message: number
  }

  export type ProjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | ProjectCountOutputTypeCountMessageArgs
  }

  // Custom InputTypes
  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectCountOutputType
     */
    select?: ProjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountMessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Fragment
   */

  export type AggregateFragment = {
    _count: FragmentCountAggregateOutputType | null
    _min: FragmentMinAggregateOutputType | null
    _max: FragmentMaxAggregateOutputType | null
  }

  export type FragmentMinAggregateOutputType = {
    id: string | null
    messageId: string | null
    sandboxId: string | null
    sandboxUrl: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
    framework: $Enums.Framework | null
  }

  export type FragmentMaxAggregateOutputType = {
    id: string | null
    messageId: string | null
    sandboxId: string | null
    sandboxUrl: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
    framework: $Enums.Framework | null
  }

  export type FragmentCountAggregateOutputType = {
    id: number
    messageId: number
    sandboxId: number
    sandboxUrl: number
    title: number
    files: number
    metadata: number
    createdAt: number
    updatedAt: number
    framework: number
    _all: number
  }


  export type FragmentMinAggregateInputType = {
    id?: true
    messageId?: true
    sandboxId?: true
    sandboxUrl?: true
    title?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
  }

  export type FragmentMaxAggregateInputType = {
    id?: true
    messageId?: true
    sandboxId?: true
    sandboxUrl?: true
    title?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
  }

  export type FragmentCountAggregateInputType = {
    id?: true
    messageId?: true
    sandboxId?: true
    sandboxUrl?: true
    title?: true
    files?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
    _all?: true
  }

  export type FragmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fragment to aggregate.
     */
    where?: FragmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fragments to fetch.
     */
    orderBy?: FragmentOrderByWithRelationInput | FragmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FragmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fragments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fragments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Fragments
    **/
    _count?: true | FragmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FragmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FragmentMaxAggregateInputType
  }

  export type GetFragmentAggregateType<T extends FragmentAggregateArgs> = {
        [P in keyof T & keyof AggregateFragment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFragment[P]>
      : GetScalarType<T[P], AggregateFragment[P]>
  }




  export type FragmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FragmentWhereInput
    orderBy?: FragmentOrderByWithAggregationInput | FragmentOrderByWithAggregationInput[]
    by: FragmentScalarFieldEnum[] | FragmentScalarFieldEnum
    having?: FragmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FragmentCountAggregateInputType | true
    _min?: FragmentMinAggregateInputType
    _max?: FragmentMaxAggregateInputType
  }

  export type FragmentGroupByOutputType = {
    id: string
    messageId: string
    sandboxId: string | null
    sandboxUrl: string
    title: string
    files: JsonValue
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    framework: $Enums.Framework
    _count: FragmentCountAggregateOutputType | null
    _min: FragmentMinAggregateOutputType | null
    _max: FragmentMaxAggregateOutputType | null
  }

  type GetFragmentGroupByPayload<T extends FragmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FragmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FragmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FragmentGroupByOutputType[P]>
            : GetScalarType<T[P], FragmentGroupByOutputType[P]>
        }
      >
    >


  export type FragmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    messageId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    title?: boolean
    files?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragment"]>

  export type FragmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    messageId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    title?: boolean
    files?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragment"]>

  export type FragmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    messageId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    title?: boolean
    files?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragment"]>

  export type FragmentSelectScalar = {
    id?: boolean
    messageId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    title?: boolean
    files?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
  }

  export type FragmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "messageId" | "sandboxId" | "sandboxUrl" | "title" | "files" | "metadata" | "createdAt" | "updatedAt" | "framework", ExtArgs["result"]["fragment"]>
  export type FragmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type FragmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type FragmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $FragmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Fragment"
    objects: {
      Message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      messageId: string
      sandboxId: string | null
      sandboxUrl: string
      title: string
      files: Prisma.JsonValue
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
      framework: $Enums.Framework
    }, ExtArgs["result"]["fragment"]>
    composites: {}
  }

  type FragmentGetPayload<S extends boolean | null | undefined | FragmentDefaultArgs> = $Result.GetResult<Prisma.$FragmentPayload, S>

  type FragmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FragmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FragmentCountAggregateInputType | true
    }

  export interface FragmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Fragment'], meta: { name: 'Fragment' } }
    /**
     * Find zero or one Fragment that matches the filter.
     * @param {FragmentFindUniqueArgs} args - Arguments to find a Fragment
     * @example
     * // Get one Fragment
     * const fragment = await prisma.fragment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FragmentFindUniqueArgs>(args: SelectSubset<T, FragmentFindUniqueArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Fragment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FragmentFindUniqueOrThrowArgs} args - Arguments to find a Fragment
     * @example
     * // Get one Fragment
     * const fragment = await prisma.fragment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FragmentFindUniqueOrThrowArgs>(args: SelectSubset<T, FragmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fragment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentFindFirstArgs} args - Arguments to find a Fragment
     * @example
     * // Get one Fragment
     * const fragment = await prisma.fragment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FragmentFindFirstArgs>(args?: SelectSubset<T, FragmentFindFirstArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fragment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentFindFirstOrThrowArgs} args - Arguments to find a Fragment
     * @example
     * // Get one Fragment
     * const fragment = await prisma.fragment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FragmentFindFirstOrThrowArgs>(args?: SelectSubset<T, FragmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Fragments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Fragments
     * const fragments = await prisma.fragment.findMany()
     * 
     * // Get first 10 Fragments
     * const fragments = await prisma.fragment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fragmentWithIdOnly = await prisma.fragment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FragmentFindManyArgs>(args?: SelectSubset<T, FragmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Fragment.
     * @param {FragmentCreateArgs} args - Arguments to create a Fragment.
     * @example
     * // Create one Fragment
     * const Fragment = await prisma.fragment.create({
     *   data: {
     *     // ... data to create a Fragment
     *   }
     * })
     * 
     */
    create<T extends FragmentCreateArgs>(args: SelectSubset<T, FragmentCreateArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Fragments.
     * @param {FragmentCreateManyArgs} args - Arguments to create many Fragments.
     * @example
     * // Create many Fragments
     * const fragment = await prisma.fragment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FragmentCreateManyArgs>(args?: SelectSubset<T, FragmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Fragments and returns the data saved in the database.
     * @param {FragmentCreateManyAndReturnArgs} args - Arguments to create many Fragments.
     * @example
     * // Create many Fragments
     * const fragment = await prisma.fragment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Fragments and only return the `id`
     * const fragmentWithIdOnly = await prisma.fragment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FragmentCreateManyAndReturnArgs>(args?: SelectSubset<T, FragmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Fragment.
     * @param {FragmentDeleteArgs} args - Arguments to delete one Fragment.
     * @example
     * // Delete one Fragment
     * const Fragment = await prisma.fragment.delete({
     *   where: {
     *     // ... filter to delete one Fragment
     *   }
     * })
     * 
     */
    delete<T extends FragmentDeleteArgs>(args: SelectSubset<T, FragmentDeleteArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Fragment.
     * @param {FragmentUpdateArgs} args - Arguments to update one Fragment.
     * @example
     * // Update one Fragment
     * const fragment = await prisma.fragment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FragmentUpdateArgs>(args: SelectSubset<T, FragmentUpdateArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Fragments.
     * @param {FragmentDeleteManyArgs} args - Arguments to filter Fragments to delete.
     * @example
     * // Delete a few Fragments
     * const { count } = await prisma.fragment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FragmentDeleteManyArgs>(args?: SelectSubset<T, FragmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fragments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Fragments
     * const fragment = await prisma.fragment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FragmentUpdateManyArgs>(args: SelectSubset<T, FragmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fragments and returns the data updated in the database.
     * @param {FragmentUpdateManyAndReturnArgs} args - Arguments to update many Fragments.
     * @example
     * // Update many Fragments
     * const fragment = await prisma.fragment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Fragments and only return the `id`
     * const fragmentWithIdOnly = await prisma.fragment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FragmentUpdateManyAndReturnArgs>(args: SelectSubset<T, FragmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Fragment.
     * @param {FragmentUpsertArgs} args - Arguments to update or create a Fragment.
     * @example
     * // Update or create a Fragment
     * const fragment = await prisma.fragment.upsert({
     *   create: {
     *     // ... data to create a Fragment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Fragment we want to update
     *   }
     * })
     */
    upsert<T extends FragmentUpsertArgs>(args: SelectSubset<T, FragmentUpsertArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Fragments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentCountArgs} args - Arguments to filter Fragments to count.
     * @example
     * // Count the number of Fragments
     * const count = await prisma.fragment.count({
     *   where: {
     *     // ... the filter for the Fragments we want to count
     *   }
     * })
    **/
    count<T extends FragmentCountArgs>(
      args?: Subset<T, FragmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FragmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Fragment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FragmentAggregateArgs>(args: Subset<T, FragmentAggregateArgs>): Prisma.PrismaPromise<GetFragmentAggregateType<T>>

    /**
     * Group by Fragment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FragmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FragmentGroupByArgs['orderBy'] }
        : { orderBy?: FragmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FragmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFragmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Fragment model
   */
  readonly fields: FragmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Fragment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FragmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Fragment model
   */
  interface FragmentFieldRefs {
    readonly id: FieldRef<"Fragment", 'String'>
    readonly messageId: FieldRef<"Fragment", 'String'>
    readonly sandboxId: FieldRef<"Fragment", 'String'>
    readonly sandboxUrl: FieldRef<"Fragment", 'String'>
    readonly title: FieldRef<"Fragment", 'String'>
    readonly files: FieldRef<"Fragment", 'Json'>
    readonly metadata: FieldRef<"Fragment", 'Json'>
    readonly createdAt: FieldRef<"Fragment", 'DateTime'>
    readonly updatedAt: FieldRef<"Fragment", 'DateTime'>
    readonly framework: FieldRef<"Fragment", 'Framework'>
  }
    

  // Custom InputTypes
  /**
   * Fragment findUnique
   */
  export type FragmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter, which Fragment to fetch.
     */
    where: FragmentWhereUniqueInput
  }

  /**
   * Fragment findUniqueOrThrow
   */
  export type FragmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter, which Fragment to fetch.
     */
    where: FragmentWhereUniqueInput
  }

  /**
   * Fragment findFirst
   */
  export type FragmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter, which Fragment to fetch.
     */
    where?: FragmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fragments to fetch.
     */
    orderBy?: FragmentOrderByWithRelationInput | FragmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fragments.
     */
    cursor?: FragmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fragments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fragments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fragments.
     */
    distinct?: FragmentScalarFieldEnum | FragmentScalarFieldEnum[]
  }

  /**
   * Fragment findFirstOrThrow
   */
  export type FragmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter, which Fragment to fetch.
     */
    where?: FragmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fragments to fetch.
     */
    orderBy?: FragmentOrderByWithRelationInput | FragmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fragments.
     */
    cursor?: FragmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fragments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fragments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fragments.
     */
    distinct?: FragmentScalarFieldEnum | FragmentScalarFieldEnum[]
  }

  /**
   * Fragment findMany
   */
  export type FragmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter, which Fragments to fetch.
     */
    where?: FragmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fragments to fetch.
     */
    orderBy?: FragmentOrderByWithRelationInput | FragmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Fragments.
     */
    cursor?: FragmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fragments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fragments.
     */
    skip?: number
    distinct?: FragmentScalarFieldEnum | FragmentScalarFieldEnum[]
  }

  /**
   * Fragment create
   */
  export type FragmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * The data needed to create a Fragment.
     */
    data: XOR<FragmentCreateInput, FragmentUncheckedCreateInput>
  }

  /**
   * Fragment createMany
   */
  export type FragmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Fragments.
     */
    data: FragmentCreateManyInput | FragmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Fragment createManyAndReturn
   */
  export type FragmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * The data used to create many Fragments.
     */
    data: FragmentCreateManyInput | FragmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Fragment update
   */
  export type FragmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * The data needed to update a Fragment.
     */
    data: XOR<FragmentUpdateInput, FragmentUncheckedUpdateInput>
    /**
     * Choose, which Fragment to update.
     */
    where: FragmentWhereUniqueInput
  }

  /**
   * Fragment updateMany
   */
  export type FragmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Fragments.
     */
    data: XOR<FragmentUpdateManyMutationInput, FragmentUncheckedUpdateManyInput>
    /**
     * Filter which Fragments to update
     */
    where?: FragmentWhereInput
    /**
     * Limit how many Fragments to update.
     */
    limit?: number
  }

  /**
   * Fragment updateManyAndReturn
   */
  export type FragmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * The data used to update Fragments.
     */
    data: XOR<FragmentUpdateManyMutationInput, FragmentUncheckedUpdateManyInput>
    /**
     * Filter which Fragments to update
     */
    where?: FragmentWhereInput
    /**
     * Limit how many Fragments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Fragment upsert
   */
  export type FragmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * The filter to search for the Fragment to update in case it exists.
     */
    where: FragmentWhereUniqueInput
    /**
     * In case the Fragment found by the `where` argument doesn't exist, create a new Fragment with this data.
     */
    create: XOR<FragmentCreateInput, FragmentUncheckedCreateInput>
    /**
     * In case the Fragment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FragmentUpdateInput, FragmentUncheckedUpdateInput>
  }

  /**
   * Fragment delete
   */
  export type FragmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    /**
     * Filter which Fragment to delete.
     */
    where: FragmentWhereUniqueInput
  }

  /**
   * Fragment deleteMany
   */
  export type FragmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fragments to delete
     */
    where?: FragmentWhereInput
    /**
     * Limit how many Fragments to delete.
     */
    limit?: number
  }

  /**
   * Fragment without action
   */
  export type FragmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
  }


  /**
   * Model FragmentDraft
   */

  export type AggregateFragmentDraft = {
    _count: FragmentDraftCountAggregateOutputType | null
    _min: FragmentDraftMinAggregateOutputType | null
    _max: FragmentDraftMaxAggregateOutputType | null
  }

  export type FragmentDraftMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    sandboxId: string | null
    sandboxUrl: string | null
    framework: $Enums.Framework | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FragmentDraftMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    sandboxId: string | null
    sandboxUrl: string | null
    framework: $Enums.Framework | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FragmentDraftCountAggregateOutputType = {
    id: number
    projectId: number
    sandboxId: number
    sandboxUrl: number
    files: number
    framework: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FragmentDraftMinAggregateInputType = {
    id?: true
    projectId?: true
    sandboxId?: true
    sandboxUrl?: true
    framework?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FragmentDraftMaxAggregateInputType = {
    id?: true
    projectId?: true
    sandboxId?: true
    sandboxUrl?: true
    framework?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FragmentDraftCountAggregateInputType = {
    id?: true
    projectId?: true
    sandboxId?: true
    sandboxUrl?: true
    files?: true
    framework?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FragmentDraftAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FragmentDraft to aggregate.
     */
    where?: FragmentDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FragmentDrafts to fetch.
     */
    orderBy?: FragmentDraftOrderByWithRelationInput | FragmentDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FragmentDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FragmentDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FragmentDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FragmentDrafts
    **/
    _count?: true | FragmentDraftCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FragmentDraftMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FragmentDraftMaxAggregateInputType
  }

  export type GetFragmentDraftAggregateType<T extends FragmentDraftAggregateArgs> = {
        [P in keyof T & keyof AggregateFragmentDraft]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFragmentDraft[P]>
      : GetScalarType<T[P], AggregateFragmentDraft[P]>
  }




  export type FragmentDraftGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FragmentDraftWhereInput
    orderBy?: FragmentDraftOrderByWithAggregationInput | FragmentDraftOrderByWithAggregationInput[]
    by: FragmentDraftScalarFieldEnum[] | FragmentDraftScalarFieldEnum
    having?: FragmentDraftScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FragmentDraftCountAggregateInputType | true
    _min?: FragmentDraftMinAggregateInputType
    _max?: FragmentDraftMaxAggregateInputType
  }

  export type FragmentDraftGroupByOutputType = {
    id: string
    projectId: string
    sandboxId: string | null
    sandboxUrl: string | null
    files: JsonValue
    framework: $Enums.Framework
    createdAt: Date
    updatedAt: Date
    _count: FragmentDraftCountAggregateOutputType | null
    _min: FragmentDraftMinAggregateOutputType | null
    _max: FragmentDraftMaxAggregateOutputType | null
  }

  type GetFragmentDraftGroupByPayload<T extends FragmentDraftGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FragmentDraftGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FragmentDraftGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FragmentDraftGroupByOutputType[P]>
            : GetScalarType<T[P], FragmentDraftGroupByOutputType[P]>
        }
      >
    >


  export type FragmentDraftSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    files?: boolean
    framework?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragmentDraft"]>

  export type FragmentDraftSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    files?: boolean
    framework?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragmentDraft"]>

  export type FragmentDraftSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    files?: boolean
    framework?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fragmentDraft"]>

  export type FragmentDraftSelectScalar = {
    id?: boolean
    projectId?: boolean
    sandboxId?: boolean
    sandboxUrl?: boolean
    files?: boolean
    framework?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FragmentDraftOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "sandboxId" | "sandboxUrl" | "files" | "framework" | "createdAt" | "updatedAt", ExtArgs["result"]["fragmentDraft"]>
  export type FragmentDraftInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type FragmentDraftIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type FragmentDraftIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $FragmentDraftPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FragmentDraft"
    objects: {
      Project: Prisma.$ProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      sandboxId: string | null
      sandboxUrl: string | null
      files: Prisma.JsonValue
      framework: $Enums.Framework
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["fragmentDraft"]>
    composites: {}
  }

  type FragmentDraftGetPayload<S extends boolean | null | undefined | FragmentDraftDefaultArgs> = $Result.GetResult<Prisma.$FragmentDraftPayload, S>

  type FragmentDraftCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FragmentDraftFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FragmentDraftCountAggregateInputType | true
    }

  export interface FragmentDraftDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FragmentDraft'], meta: { name: 'FragmentDraft' } }
    /**
     * Find zero or one FragmentDraft that matches the filter.
     * @param {FragmentDraftFindUniqueArgs} args - Arguments to find a FragmentDraft
     * @example
     * // Get one FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FragmentDraftFindUniqueArgs>(args: SelectSubset<T, FragmentDraftFindUniqueArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FragmentDraft that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FragmentDraftFindUniqueOrThrowArgs} args - Arguments to find a FragmentDraft
     * @example
     * // Get one FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FragmentDraftFindUniqueOrThrowArgs>(args: SelectSubset<T, FragmentDraftFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FragmentDraft that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftFindFirstArgs} args - Arguments to find a FragmentDraft
     * @example
     * // Get one FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FragmentDraftFindFirstArgs>(args?: SelectSubset<T, FragmentDraftFindFirstArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FragmentDraft that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftFindFirstOrThrowArgs} args - Arguments to find a FragmentDraft
     * @example
     * // Get one FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FragmentDraftFindFirstOrThrowArgs>(args?: SelectSubset<T, FragmentDraftFindFirstOrThrowArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FragmentDrafts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FragmentDrafts
     * const fragmentDrafts = await prisma.fragmentDraft.findMany()
     * 
     * // Get first 10 FragmentDrafts
     * const fragmentDrafts = await prisma.fragmentDraft.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fragmentDraftWithIdOnly = await prisma.fragmentDraft.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FragmentDraftFindManyArgs>(args?: SelectSubset<T, FragmentDraftFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FragmentDraft.
     * @param {FragmentDraftCreateArgs} args - Arguments to create a FragmentDraft.
     * @example
     * // Create one FragmentDraft
     * const FragmentDraft = await prisma.fragmentDraft.create({
     *   data: {
     *     // ... data to create a FragmentDraft
     *   }
     * })
     * 
     */
    create<T extends FragmentDraftCreateArgs>(args: SelectSubset<T, FragmentDraftCreateArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FragmentDrafts.
     * @param {FragmentDraftCreateManyArgs} args - Arguments to create many FragmentDrafts.
     * @example
     * // Create many FragmentDrafts
     * const fragmentDraft = await prisma.fragmentDraft.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FragmentDraftCreateManyArgs>(args?: SelectSubset<T, FragmentDraftCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FragmentDrafts and returns the data saved in the database.
     * @param {FragmentDraftCreateManyAndReturnArgs} args - Arguments to create many FragmentDrafts.
     * @example
     * // Create many FragmentDrafts
     * const fragmentDraft = await prisma.fragmentDraft.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FragmentDrafts and only return the `id`
     * const fragmentDraftWithIdOnly = await prisma.fragmentDraft.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FragmentDraftCreateManyAndReturnArgs>(args?: SelectSubset<T, FragmentDraftCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FragmentDraft.
     * @param {FragmentDraftDeleteArgs} args - Arguments to delete one FragmentDraft.
     * @example
     * // Delete one FragmentDraft
     * const FragmentDraft = await prisma.fragmentDraft.delete({
     *   where: {
     *     // ... filter to delete one FragmentDraft
     *   }
     * })
     * 
     */
    delete<T extends FragmentDraftDeleteArgs>(args: SelectSubset<T, FragmentDraftDeleteArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FragmentDraft.
     * @param {FragmentDraftUpdateArgs} args - Arguments to update one FragmentDraft.
     * @example
     * // Update one FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FragmentDraftUpdateArgs>(args: SelectSubset<T, FragmentDraftUpdateArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FragmentDrafts.
     * @param {FragmentDraftDeleteManyArgs} args - Arguments to filter FragmentDrafts to delete.
     * @example
     * // Delete a few FragmentDrafts
     * const { count } = await prisma.fragmentDraft.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FragmentDraftDeleteManyArgs>(args?: SelectSubset<T, FragmentDraftDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FragmentDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FragmentDrafts
     * const fragmentDraft = await prisma.fragmentDraft.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FragmentDraftUpdateManyArgs>(args: SelectSubset<T, FragmentDraftUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FragmentDrafts and returns the data updated in the database.
     * @param {FragmentDraftUpdateManyAndReturnArgs} args - Arguments to update many FragmentDrafts.
     * @example
     * // Update many FragmentDrafts
     * const fragmentDraft = await prisma.fragmentDraft.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FragmentDrafts and only return the `id`
     * const fragmentDraftWithIdOnly = await prisma.fragmentDraft.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FragmentDraftUpdateManyAndReturnArgs>(args: SelectSubset<T, FragmentDraftUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FragmentDraft.
     * @param {FragmentDraftUpsertArgs} args - Arguments to update or create a FragmentDraft.
     * @example
     * // Update or create a FragmentDraft
     * const fragmentDraft = await prisma.fragmentDraft.upsert({
     *   create: {
     *     // ... data to create a FragmentDraft
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FragmentDraft we want to update
     *   }
     * })
     */
    upsert<T extends FragmentDraftUpsertArgs>(args: SelectSubset<T, FragmentDraftUpsertArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FragmentDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftCountArgs} args - Arguments to filter FragmentDrafts to count.
     * @example
     * // Count the number of FragmentDrafts
     * const count = await prisma.fragmentDraft.count({
     *   where: {
     *     // ... the filter for the FragmentDrafts we want to count
     *   }
     * })
    **/
    count<T extends FragmentDraftCountArgs>(
      args?: Subset<T, FragmentDraftCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FragmentDraftCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FragmentDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FragmentDraftAggregateArgs>(args: Subset<T, FragmentDraftAggregateArgs>): Prisma.PrismaPromise<GetFragmentDraftAggregateType<T>>

    /**
     * Group by FragmentDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FragmentDraftGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FragmentDraftGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FragmentDraftGroupByArgs['orderBy'] }
        : { orderBy?: FragmentDraftGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FragmentDraftGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFragmentDraftGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FragmentDraft model
   */
  readonly fields: FragmentDraftFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FragmentDraft.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FragmentDraftClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FragmentDraft model
   */
  interface FragmentDraftFieldRefs {
    readonly id: FieldRef<"FragmentDraft", 'String'>
    readonly projectId: FieldRef<"FragmentDraft", 'String'>
    readonly sandboxId: FieldRef<"FragmentDraft", 'String'>
    readonly sandboxUrl: FieldRef<"FragmentDraft", 'String'>
    readonly files: FieldRef<"FragmentDraft", 'Json'>
    readonly framework: FieldRef<"FragmentDraft", 'Framework'>
    readonly createdAt: FieldRef<"FragmentDraft", 'DateTime'>
    readonly updatedAt: FieldRef<"FragmentDraft", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FragmentDraft findUnique
   */
  export type FragmentDraftFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter, which FragmentDraft to fetch.
     */
    where: FragmentDraftWhereUniqueInput
  }

  /**
   * FragmentDraft findUniqueOrThrow
   */
  export type FragmentDraftFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter, which FragmentDraft to fetch.
     */
    where: FragmentDraftWhereUniqueInput
  }

  /**
   * FragmentDraft findFirst
   */
  export type FragmentDraftFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter, which FragmentDraft to fetch.
     */
    where?: FragmentDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FragmentDrafts to fetch.
     */
    orderBy?: FragmentDraftOrderByWithRelationInput | FragmentDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FragmentDrafts.
     */
    cursor?: FragmentDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FragmentDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FragmentDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FragmentDrafts.
     */
    distinct?: FragmentDraftScalarFieldEnum | FragmentDraftScalarFieldEnum[]
  }

  /**
   * FragmentDraft findFirstOrThrow
   */
  export type FragmentDraftFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter, which FragmentDraft to fetch.
     */
    where?: FragmentDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FragmentDrafts to fetch.
     */
    orderBy?: FragmentDraftOrderByWithRelationInput | FragmentDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FragmentDrafts.
     */
    cursor?: FragmentDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FragmentDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FragmentDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FragmentDrafts.
     */
    distinct?: FragmentDraftScalarFieldEnum | FragmentDraftScalarFieldEnum[]
  }

  /**
   * FragmentDraft findMany
   */
  export type FragmentDraftFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter, which FragmentDrafts to fetch.
     */
    where?: FragmentDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FragmentDrafts to fetch.
     */
    orderBy?: FragmentDraftOrderByWithRelationInput | FragmentDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FragmentDrafts.
     */
    cursor?: FragmentDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FragmentDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FragmentDrafts.
     */
    skip?: number
    distinct?: FragmentDraftScalarFieldEnum | FragmentDraftScalarFieldEnum[]
  }

  /**
   * FragmentDraft create
   */
  export type FragmentDraftCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * The data needed to create a FragmentDraft.
     */
    data: XOR<FragmentDraftCreateInput, FragmentDraftUncheckedCreateInput>
  }

  /**
   * FragmentDraft createMany
   */
  export type FragmentDraftCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FragmentDrafts.
     */
    data: FragmentDraftCreateManyInput | FragmentDraftCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FragmentDraft createManyAndReturn
   */
  export type FragmentDraftCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * The data used to create many FragmentDrafts.
     */
    data: FragmentDraftCreateManyInput | FragmentDraftCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * FragmentDraft update
   */
  export type FragmentDraftUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * The data needed to update a FragmentDraft.
     */
    data: XOR<FragmentDraftUpdateInput, FragmentDraftUncheckedUpdateInput>
    /**
     * Choose, which FragmentDraft to update.
     */
    where: FragmentDraftWhereUniqueInput
  }

  /**
   * FragmentDraft updateMany
   */
  export type FragmentDraftUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FragmentDrafts.
     */
    data: XOR<FragmentDraftUpdateManyMutationInput, FragmentDraftUncheckedUpdateManyInput>
    /**
     * Filter which FragmentDrafts to update
     */
    where?: FragmentDraftWhereInput
    /**
     * Limit how many FragmentDrafts to update.
     */
    limit?: number
  }

  /**
   * FragmentDraft updateManyAndReturn
   */
  export type FragmentDraftUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * The data used to update FragmentDrafts.
     */
    data: XOR<FragmentDraftUpdateManyMutationInput, FragmentDraftUncheckedUpdateManyInput>
    /**
     * Filter which FragmentDrafts to update
     */
    where?: FragmentDraftWhereInput
    /**
     * Limit how many FragmentDrafts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * FragmentDraft upsert
   */
  export type FragmentDraftUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * The filter to search for the FragmentDraft to update in case it exists.
     */
    where: FragmentDraftWhereUniqueInput
    /**
     * In case the FragmentDraft found by the `where` argument doesn't exist, create a new FragmentDraft with this data.
     */
    create: XOR<FragmentDraftCreateInput, FragmentDraftUncheckedCreateInput>
    /**
     * In case the FragmentDraft was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FragmentDraftUpdateInput, FragmentDraftUncheckedUpdateInput>
  }

  /**
   * FragmentDraft delete
   */
  export type FragmentDraftDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    /**
     * Filter which FragmentDraft to delete.
     */
    where: FragmentDraftWhereUniqueInput
  }

  /**
   * FragmentDraft deleteMany
   */
  export type FragmentDraftDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FragmentDrafts to delete
     */
    where?: FragmentDraftWhereInput
    /**
     * Limit how many FragmentDrafts to delete.
     */
    limit?: number
  }

  /**
   * FragmentDraft without action
   */
  export type FragmentDraftDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    content: string | null
    role: $Enums.MessageRole | null
    type: $Enums.MessageType | null
    status: $Enums.MessageStatus | null
    createdAt: Date | null
    updatedAt: Date | null
    projectId: string | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    content: string | null
    role: $Enums.MessageRole | null
    type: $Enums.MessageType | null
    status: $Enums.MessageStatus | null
    createdAt: Date | null
    updatedAt: Date | null
    projectId: string | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    content: number
    role: number
    type: number
    status: number
    createdAt: number
    updatedAt: number
    projectId: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    content?: true
    role?: true
    type?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    projectId?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    content?: true
    role?: true
    type?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    projectId?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    content?: true
    role?: true
    type?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    projectId?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status: $Enums.MessageStatus
    createdAt: Date
    updatedAt: Date
    projectId: string
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    role?: boolean
    type?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    projectId?: boolean
    Fragment?: boolean | Message$FragmentArgs<ExtArgs>
    Attachment?: boolean | Message$AttachmentArgs<ExtArgs>
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    role?: boolean
    type?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    projectId?: boolean
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    role?: boolean
    type?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    projectId?: boolean
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    content?: boolean
    role?: boolean
    type?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    projectId?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "role" | "type" | "status" | "createdAt" | "updatedAt" | "projectId", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Fragment?: boolean | Message$FragmentArgs<ExtArgs>
    Attachment?: boolean | Message$AttachmentArgs<ExtArgs>
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type MessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      Fragment: Prisma.$FragmentPayload<ExtArgs> | null
      Attachment: Prisma.$AttachmentPayload<ExtArgs>[]
      Project: Prisma.$ProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      content: string
      role: $Enums.MessageRole
      type: $Enums.MessageType
      status: $Enums.MessageStatus
      createdAt: Date
      updatedAt: Date
      projectId: string
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages and returns the data updated in the database.
     * @param {MessageUpdateManyAndReturnArgs} args - Arguments to update many Messages.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Fragment<T extends Message$FragmentArgs<ExtArgs> = {}>(args?: Subset<T, Message$FragmentArgs<ExtArgs>>): Prisma__FragmentClient<$Result.GetResult<Prisma.$FragmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    Attachment<T extends Message$AttachmentArgs<ExtArgs> = {}>(args?: Subset<T, Message$AttachmentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    Project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly content: FieldRef<"Message", 'String'>
    readonly role: FieldRef<"Message", 'MessageRole'>
    readonly type: FieldRef<"Message", 'MessageType'>
    readonly status: FieldRef<"Message", 'MessageStatus'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
    readonly updatedAt: FieldRef<"Message", 'DateTime'>
    readonly projectId: FieldRef<"Message", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message updateManyAndReturn
   */
  export type MessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message.Fragment
   */
  export type Message$FragmentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fragment
     */
    select?: FragmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fragment
     */
    omit?: FragmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentInclude<ExtArgs> | null
    where?: FragmentWhereInput
  }

  /**
   * Message.Attachment
   */
  export type Message$AttachmentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    where?: AttachmentWhereInput
    orderBy?: AttachmentOrderByWithRelationInput | AttachmentOrderByWithRelationInput[]
    cursor?: AttachmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AttachmentScalarFieldEnum | AttachmentScalarFieldEnum[]
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model Project
   */

  export type AggregateProject = {
    _count: ProjectCountAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  export type ProjectMinAggregateOutputType = {
    id: string | null
    name: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    framework: $Enums.Framework | null
  }

  export type ProjectMaxAggregateOutputType = {
    id: string | null
    name: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    framework: $Enums.Framework | null
  }

  export type ProjectCountAggregateOutputType = {
    id: number
    name: number
    userId: number
    createdAt: number
    updatedAt: number
    framework: number
    _all: number
  }


  export type ProjectMinAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
  }

  export type ProjectMaxAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
  }

  export type ProjectCountAggregateInputType = {
    id?: true
    name?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    framework?: true
    _all?: true
  }

  export type ProjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Project to aggregate.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Projects
    **/
    _count?: true | ProjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectMaxAggregateInputType
  }

  export type GetProjectAggregateType<T extends ProjectAggregateArgs> = {
        [P in keyof T & keyof AggregateProject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProject[P]>
      : GetScalarType<T[P], AggregateProject[P]>
  }




  export type ProjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectWhereInput
    orderBy?: ProjectOrderByWithAggregationInput | ProjectOrderByWithAggregationInput[]
    by: ProjectScalarFieldEnum[] | ProjectScalarFieldEnum
    having?: ProjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectCountAggregateInputType | true
    _min?: ProjectMinAggregateInputType
    _max?: ProjectMaxAggregateInputType
  }

  export type ProjectGroupByOutputType = {
    id: string
    name: string
    userId: string
    createdAt: Date
    updatedAt: Date
    framework: $Enums.Framework
    _count: ProjectCountAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  type GetProjectGroupByPayload<T extends ProjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectGroupByOutputType[P]>
        }
      >
    >


  export type ProjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
    FragmentDraft?: boolean | Project$FragmentDraftArgs<ExtArgs>
    Message?: boolean | Project$MessageArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectScalar = {
    id?: boolean
    name?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    framework?: boolean
  }

  export type ProjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "userId" | "createdAt" | "updatedAt" | "framework", ExtArgs["result"]["project"]>
  export type ProjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    FragmentDraft?: boolean | Project$FragmentDraftArgs<ExtArgs>
    Message?: boolean | Project$MessageArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Project"
    objects: {
      FragmentDraft: Prisma.$FragmentDraftPayload<ExtArgs> | null
      Message: Prisma.$MessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      userId: string
      createdAt: Date
      updatedAt: Date
      framework: $Enums.Framework
    }, ExtArgs["result"]["project"]>
    composites: {}
  }

  type ProjectGetPayload<S extends boolean | null | undefined | ProjectDefaultArgs> = $Result.GetResult<Prisma.$ProjectPayload, S>

  type ProjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectCountAggregateInputType | true
    }

  export interface ProjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Project'], meta: { name: 'Project' } }
    /**
     * Find zero or one Project that matches the filter.
     * @param {ProjectFindUniqueArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectFindUniqueArgs>(args: SelectSubset<T, ProjectFindUniqueArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Project that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectFindUniqueOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectFindFirstArgs>(args?: SelectSubset<T, ProjectFindFirstArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Projects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Projects
     * const projects = await prisma.project.findMany()
     * 
     * // Get first 10 Projects
     * const projects = await prisma.project.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectWithIdOnly = await prisma.project.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectFindManyArgs>(args?: SelectSubset<T, ProjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Project.
     * @param {ProjectCreateArgs} args - Arguments to create a Project.
     * @example
     * // Create one Project
     * const Project = await prisma.project.create({
     *   data: {
     *     // ... data to create a Project
     *   }
     * })
     * 
     */
    create<T extends ProjectCreateArgs>(args: SelectSubset<T, ProjectCreateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Projects.
     * @param {ProjectCreateManyArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectCreateManyArgs>(args?: SelectSubset<T, ProjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Projects and returns the data saved in the database.
     * @param {ProjectCreateManyAndReturnArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Project.
     * @param {ProjectDeleteArgs} args - Arguments to delete one Project.
     * @example
     * // Delete one Project
     * const Project = await prisma.project.delete({
     *   where: {
     *     // ... filter to delete one Project
     *   }
     * })
     * 
     */
    delete<T extends ProjectDeleteArgs>(args: SelectSubset<T, ProjectDeleteArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Project.
     * @param {ProjectUpdateArgs} args - Arguments to update one Project.
     * @example
     * // Update one Project
     * const project = await prisma.project.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectUpdateArgs>(args: SelectSubset<T, ProjectUpdateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Projects.
     * @param {ProjectDeleteManyArgs} args - Arguments to filter Projects to delete.
     * @example
     * // Delete a few Projects
     * const { count } = await prisma.project.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectDeleteManyArgs>(args?: SelectSubset<T, ProjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectUpdateManyArgs>(args: SelectSubset<T, ProjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects and returns the data updated in the database.
     * @param {ProjectUpdateManyAndReturnArgs} args - Arguments to update many Projects.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Project.
     * @param {ProjectUpsertArgs} args - Arguments to update or create a Project.
     * @example
     * // Update or create a Project
     * const project = await prisma.project.upsert({
     *   create: {
     *     // ... data to create a Project
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Project we want to update
     *   }
     * })
     */
    upsert<T extends ProjectUpsertArgs>(args: SelectSubset<T, ProjectUpsertArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectCountArgs} args - Arguments to filter Projects to count.
     * @example
     * // Count the number of Projects
     * const count = await prisma.project.count({
     *   where: {
     *     // ... the filter for the Projects we want to count
     *   }
     * })
    **/
    count<T extends ProjectCountArgs>(
      args?: Subset<T, ProjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectAggregateArgs>(args: Subset<T, ProjectAggregateArgs>): Prisma.PrismaPromise<GetProjectAggregateType<T>>

    /**
     * Group by Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectGroupByArgs['orderBy'] }
        : { orderBy?: ProjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Project model
   */
  readonly fields: ProjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Project.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    FragmentDraft<T extends Project$FragmentDraftArgs<ExtArgs> = {}>(args?: Subset<T, Project$FragmentDraftArgs<ExtArgs>>): Prisma__FragmentDraftClient<$Result.GetResult<Prisma.$FragmentDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    Message<T extends Project$MessageArgs<ExtArgs> = {}>(args?: Subset<T, Project$MessageArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Project model
   */
  interface ProjectFieldRefs {
    readonly id: FieldRef<"Project", 'String'>
    readonly name: FieldRef<"Project", 'String'>
    readonly userId: FieldRef<"Project", 'String'>
    readonly createdAt: FieldRef<"Project", 'DateTime'>
    readonly updatedAt: FieldRef<"Project", 'DateTime'>
    readonly framework: FieldRef<"Project", 'Framework'>
  }
    

  // Custom InputTypes
  /**
   * Project findUnique
   */
  export type ProjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findUniqueOrThrow
   */
  export type ProjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findFirst
   */
  export type ProjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findFirstOrThrow
   */
  export type ProjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findMany
   */
  export type ProjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Projects to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project create
   */
  export type ProjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to create a Project.
     */
    data: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
  }

  /**
   * Project createMany
   */
  export type ProjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Project createManyAndReturn
   */
  export type ProjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Project update
   */
  export type ProjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to update a Project.
     */
    data: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
    /**
     * Choose, which Project to update.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project updateMany
   */
  export type ProjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
  }

  /**
   * Project updateManyAndReturn
   */
  export type ProjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
  }

  /**
   * Project upsert
   */
  export type ProjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The filter to search for the Project to update in case it exists.
     */
    where: ProjectWhereUniqueInput
    /**
     * In case the Project found by the `where` argument doesn't exist, create a new Project with this data.
     */
    create: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
    /**
     * In case the Project was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
  }

  /**
   * Project delete
   */
  export type ProjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter which Project to delete.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project deleteMany
   */
  export type ProjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Projects to delete
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to delete.
     */
    limit?: number
  }

  /**
   * Project.FragmentDraft
   */
  export type Project$FragmentDraftArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FragmentDraft
     */
    select?: FragmentDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FragmentDraft
     */
    omit?: FragmentDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FragmentDraftInclude<ExtArgs> | null
    where?: FragmentDraftWhereInput
  }

  /**
   * Project.Message
   */
  export type Project$MessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Project without action
   */
  export type ProjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
  }


  /**
   * Model Usage
   */

  export type AggregateUsage = {
    _count: UsageCountAggregateOutputType | null
    _avg: UsageAvgAggregateOutputType | null
    _sum: UsageSumAggregateOutputType | null
    _min: UsageMinAggregateOutputType | null
    _max: UsageMaxAggregateOutputType | null
  }

  export type UsageAvgAggregateOutputType = {
    points: number | null
  }

  export type UsageSumAggregateOutputType = {
    points: number | null
  }

  export type UsageMinAggregateOutputType = {
    key: string | null
    points: number | null
    expire: Date | null
  }

  export type UsageMaxAggregateOutputType = {
    key: string | null
    points: number | null
    expire: Date | null
  }

  export type UsageCountAggregateOutputType = {
    key: number
    points: number
    expire: number
    _all: number
  }


  export type UsageAvgAggregateInputType = {
    points?: true
  }

  export type UsageSumAggregateInputType = {
    points?: true
  }

  export type UsageMinAggregateInputType = {
    key?: true
    points?: true
    expire?: true
  }

  export type UsageMaxAggregateInputType = {
    key?: true
    points?: true
    expire?: true
  }

  export type UsageCountAggregateInputType = {
    key?: true
    points?: true
    expire?: true
    _all?: true
  }

  export type UsageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Usage to aggregate.
     */
    where?: UsageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Usages to fetch.
     */
    orderBy?: UsageOrderByWithRelationInput | UsageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UsageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Usages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Usages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Usages
    **/
    _count?: true | UsageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UsageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UsageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UsageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UsageMaxAggregateInputType
  }

  export type GetUsageAggregateType<T extends UsageAggregateArgs> = {
        [P in keyof T & keyof AggregateUsage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUsage[P]>
      : GetScalarType<T[P], AggregateUsage[P]>
  }




  export type UsageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UsageWhereInput
    orderBy?: UsageOrderByWithAggregationInput | UsageOrderByWithAggregationInput[]
    by: UsageScalarFieldEnum[] | UsageScalarFieldEnum
    having?: UsageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UsageCountAggregateInputType | true
    _avg?: UsageAvgAggregateInputType
    _sum?: UsageSumAggregateInputType
    _min?: UsageMinAggregateInputType
    _max?: UsageMaxAggregateInputType
  }

  export type UsageGroupByOutputType = {
    key: string
    points: number
    expire: Date | null
    _count: UsageCountAggregateOutputType | null
    _avg: UsageAvgAggregateOutputType | null
    _sum: UsageSumAggregateOutputType | null
    _min: UsageMinAggregateOutputType | null
    _max: UsageMaxAggregateOutputType | null
  }

  type GetUsageGroupByPayload<T extends UsageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UsageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UsageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UsageGroupByOutputType[P]>
            : GetScalarType<T[P], UsageGroupByOutputType[P]>
        }
      >
    >


  export type UsageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    points?: boolean
    expire?: boolean
  }, ExtArgs["result"]["usage"]>

  export type UsageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    points?: boolean
    expire?: boolean
  }, ExtArgs["result"]["usage"]>

  export type UsageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    points?: boolean
    expire?: boolean
  }, ExtArgs["result"]["usage"]>

  export type UsageSelectScalar = {
    key?: boolean
    points?: boolean
    expire?: boolean
  }

  export type UsageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"key" | "points" | "expire", ExtArgs["result"]["usage"]>

  export type $UsagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Usage"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      key: string
      points: number
      expire: Date | null
    }, ExtArgs["result"]["usage"]>
    composites: {}
  }

  type UsageGetPayload<S extends boolean | null | undefined | UsageDefaultArgs> = $Result.GetResult<Prisma.$UsagePayload, S>

  type UsageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UsageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UsageCountAggregateInputType | true
    }

  export interface UsageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Usage'], meta: { name: 'Usage' } }
    /**
     * Find zero or one Usage that matches the filter.
     * @param {UsageFindUniqueArgs} args - Arguments to find a Usage
     * @example
     * // Get one Usage
     * const usage = await prisma.usage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UsageFindUniqueArgs>(args: SelectSubset<T, UsageFindUniqueArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Usage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UsageFindUniqueOrThrowArgs} args - Arguments to find a Usage
     * @example
     * // Get one Usage
     * const usage = await prisma.usage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UsageFindUniqueOrThrowArgs>(args: SelectSubset<T, UsageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Usage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageFindFirstArgs} args - Arguments to find a Usage
     * @example
     * // Get one Usage
     * const usage = await prisma.usage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UsageFindFirstArgs>(args?: SelectSubset<T, UsageFindFirstArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Usage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageFindFirstOrThrowArgs} args - Arguments to find a Usage
     * @example
     * // Get one Usage
     * const usage = await prisma.usage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UsageFindFirstOrThrowArgs>(args?: SelectSubset<T, UsageFindFirstOrThrowArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Usages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Usages
     * const usages = await prisma.usage.findMany()
     * 
     * // Get first 10 Usages
     * const usages = await prisma.usage.findMany({ take: 10 })
     * 
     * // Only select the `key`
     * const usageWithKeyOnly = await prisma.usage.findMany({ select: { key: true } })
     * 
     */
    findMany<T extends UsageFindManyArgs>(args?: SelectSubset<T, UsageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Usage.
     * @param {UsageCreateArgs} args - Arguments to create a Usage.
     * @example
     * // Create one Usage
     * const Usage = await prisma.usage.create({
     *   data: {
     *     // ... data to create a Usage
     *   }
     * })
     * 
     */
    create<T extends UsageCreateArgs>(args: SelectSubset<T, UsageCreateArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Usages.
     * @param {UsageCreateManyArgs} args - Arguments to create many Usages.
     * @example
     * // Create many Usages
     * const usage = await prisma.usage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UsageCreateManyArgs>(args?: SelectSubset<T, UsageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Usages and returns the data saved in the database.
     * @param {UsageCreateManyAndReturnArgs} args - Arguments to create many Usages.
     * @example
     * // Create many Usages
     * const usage = await prisma.usage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Usages and only return the `key`
     * const usageWithKeyOnly = await prisma.usage.createManyAndReturn({
     *   select: { key: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UsageCreateManyAndReturnArgs>(args?: SelectSubset<T, UsageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Usage.
     * @param {UsageDeleteArgs} args - Arguments to delete one Usage.
     * @example
     * // Delete one Usage
     * const Usage = await prisma.usage.delete({
     *   where: {
     *     // ... filter to delete one Usage
     *   }
     * })
     * 
     */
    delete<T extends UsageDeleteArgs>(args: SelectSubset<T, UsageDeleteArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Usage.
     * @param {UsageUpdateArgs} args - Arguments to update one Usage.
     * @example
     * // Update one Usage
     * const usage = await prisma.usage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UsageUpdateArgs>(args: SelectSubset<T, UsageUpdateArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Usages.
     * @param {UsageDeleteManyArgs} args - Arguments to filter Usages to delete.
     * @example
     * // Delete a few Usages
     * const { count } = await prisma.usage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UsageDeleteManyArgs>(args?: SelectSubset<T, UsageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Usages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Usages
     * const usage = await prisma.usage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UsageUpdateManyArgs>(args: SelectSubset<T, UsageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Usages and returns the data updated in the database.
     * @param {UsageUpdateManyAndReturnArgs} args - Arguments to update many Usages.
     * @example
     * // Update many Usages
     * const usage = await prisma.usage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Usages and only return the `key`
     * const usageWithKeyOnly = await prisma.usage.updateManyAndReturn({
     *   select: { key: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UsageUpdateManyAndReturnArgs>(args: SelectSubset<T, UsageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Usage.
     * @param {UsageUpsertArgs} args - Arguments to update or create a Usage.
     * @example
     * // Update or create a Usage
     * const usage = await prisma.usage.upsert({
     *   create: {
     *     // ... data to create a Usage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Usage we want to update
     *   }
     * })
     */
    upsert<T extends UsageUpsertArgs>(args: SelectSubset<T, UsageUpsertArgs<ExtArgs>>): Prisma__UsageClient<$Result.GetResult<Prisma.$UsagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Usages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageCountArgs} args - Arguments to filter Usages to count.
     * @example
     * // Count the number of Usages
     * const count = await prisma.usage.count({
     *   where: {
     *     // ... the filter for the Usages we want to count
     *   }
     * })
    **/
    count<T extends UsageCountArgs>(
      args?: Subset<T, UsageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UsageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Usage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UsageAggregateArgs>(args: Subset<T, UsageAggregateArgs>): Prisma.PrismaPromise<GetUsageAggregateType<T>>

    /**
     * Group by Usage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UsageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UsageGroupByArgs['orderBy'] }
        : { orderBy?: UsageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UsageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUsageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Usage model
   */
  readonly fields: UsageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Usage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UsageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Usage model
   */
  interface UsageFieldRefs {
    readonly key: FieldRef<"Usage", 'String'>
    readonly points: FieldRef<"Usage", 'Int'>
    readonly expire: FieldRef<"Usage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Usage findUnique
   */
  export type UsageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter, which Usage to fetch.
     */
    where: UsageWhereUniqueInput
  }

  /**
   * Usage findUniqueOrThrow
   */
  export type UsageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter, which Usage to fetch.
     */
    where: UsageWhereUniqueInput
  }

  /**
   * Usage findFirst
   */
  export type UsageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter, which Usage to fetch.
     */
    where?: UsageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Usages to fetch.
     */
    orderBy?: UsageOrderByWithRelationInput | UsageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Usages.
     */
    cursor?: UsageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Usages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Usages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Usages.
     */
    distinct?: UsageScalarFieldEnum | UsageScalarFieldEnum[]
  }

  /**
   * Usage findFirstOrThrow
   */
  export type UsageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter, which Usage to fetch.
     */
    where?: UsageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Usages to fetch.
     */
    orderBy?: UsageOrderByWithRelationInput | UsageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Usages.
     */
    cursor?: UsageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Usages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Usages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Usages.
     */
    distinct?: UsageScalarFieldEnum | UsageScalarFieldEnum[]
  }

  /**
   * Usage findMany
   */
  export type UsageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter, which Usages to fetch.
     */
    where?: UsageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Usages to fetch.
     */
    orderBy?: UsageOrderByWithRelationInput | UsageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Usages.
     */
    cursor?: UsageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Usages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Usages.
     */
    skip?: number
    distinct?: UsageScalarFieldEnum | UsageScalarFieldEnum[]
  }

  /**
   * Usage create
   */
  export type UsageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * The data needed to create a Usage.
     */
    data: XOR<UsageCreateInput, UsageUncheckedCreateInput>
  }

  /**
   * Usage createMany
   */
  export type UsageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Usages.
     */
    data: UsageCreateManyInput | UsageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Usage createManyAndReturn
   */
  export type UsageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * The data used to create many Usages.
     */
    data: UsageCreateManyInput | UsageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Usage update
   */
  export type UsageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * The data needed to update a Usage.
     */
    data: XOR<UsageUpdateInput, UsageUncheckedUpdateInput>
    /**
     * Choose, which Usage to update.
     */
    where: UsageWhereUniqueInput
  }

  /**
   * Usage updateMany
   */
  export type UsageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Usages.
     */
    data: XOR<UsageUpdateManyMutationInput, UsageUncheckedUpdateManyInput>
    /**
     * Filter which Usages to update
     */
    where?: UsageWhereInput
    /**
     * Limit how many Usages to update.
     */
    limit?: number
  }

  /**
   * Usage updateManyAndReturn
   */
  export type UsageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * The data used to update Usages.
     */
    data: XOR<UsageUpdateManyMutationInput, UsageUncheckedUpdateManyInput>
    /**
     * Filter which Usages to update
     */
    where?: UsageWhereInput
    /**
     * Limit how many Usages to update.
     */
    limit?: number
  }

  /**
   * Usage upsert
   */
  export type UsageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * The filter to search for the Usage to update in case it exists.
     */
    where: UsageWhereUniqueInput
    /**
     * In case the Usage found by the `where` argument doesn't exist, create a new Usage with this data.
     */
    create: XOR<UsageCreateInput, UsageUncheckedCreateInput>
    /**
     * In case the Usage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UsageUpdateInput, UsageUncheckedUpdateInput>
  }

  /**
   * Usage delete
   */
  export type UsageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
    /**
     * Filter which Usage to delete.
     */
    where: UsageWhereUniqueInput
  }

  /**
   * Usage deleteMany
   */
  export type UsageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Usages to delete
     */
    where?: UsageWhereInput
    /**
     * Limit how many Usages to delete.
     */
    limit?: number
  }

  /**
   * Usage without action
   */
  export type UsageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Usage
     */
    select?: UsageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Usage
     */
    omit?: UsageOmit<ExtArgs> | null
  }


  /**
   * Model Attachment
   */

  export type AggregateAttachment = {
    _count: AttachmentCountAggregateOutputType | null
    _avg: AttachmentAvgAggregateOutputType | null
    _sum: AttachmentSumAggregateOutputType | null
    _min: AttachmentMinAggregateOutputType | null
    _max: AttachmentMaxAggregateOutputType | null
  }

  export type AttachmentAvgAggregateOutputType = {
    width: number | null
    height: number | null
    size: number | null
  }

  export type AttachmentSumAggregateOutputType = {
    width: number | null
    height: number | null
    size: number | null
  }

  export type AttachmentMinAggregateOutputType = {
    id: string | null
    type: $Enums.AttachmentType | null
    url: string | null
    width: number | null
    height: number | null
    size: number | null
    createdAt: Date | null
    updatedAt: Date | null
    messageId: string | null
  }

  export type AttachmentMaxAggregateOutputType = {
    id: string | null
    type: $Enums.AttachmentType | null
    url: string | null
    width: number | null
    height: number | null
    size: number | null
    createdAt: Date | null
    updatedAt: Date | null
    messageId: string | null
  }

  export type AttachmentCountAggregateOutputType = {
    id: number
    type: number
    url: number
    width: number
    height: number
    size: number
    createdAt: number
    updatedAt: number
    messageId: number
    _all: number
  }


  export type AttachmentAvgAggregateInputType = {
    width?: true
    height?: true
    size?: true
  }

  export type AttachmentSumAggregateInputType = {
    width?: true
    height?: true
    size?: true
  }

  export type AttachmentMinAggregateInputType = {
    id?: true
    type?: true
    url?: true
    width?: true
    height?: true
    size?: true
    createdAt?: true
    updatedAt?: true
    messageId?: true
  }

  export type AttachmentMaxAggregateInputType = {
    id?: true
    type?: true
    url?: true
    width?: true
    height?: true
    size?: true
    createdAt?: true
    updatedAt?: true
    messageId?: true
  }

  export type AttachmentCountAggregateInputType = {
    id?: true
    type?: true
    url?: true
    width?: true
    height?: true
    size?: true
    createdAt?: true
    updatedAt?: true
    messageId?: true
    _all?: true
  }

  export type AttachmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Attachment to aggregate.
     */
    where?: AttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentOrderByWithRelationInput | AttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Attachments
    **/
    _count?: true | AttachmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AttachmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AttachmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AttachmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AttachmentMaxAggregateInputType
  }

  export type GetAttachmentAggregateType<T extends AttachmentAggregateArgs> = {
        [P in keyof T & keyof AggregateAttachment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAttachment[P]>
      : GetScalarType<T[P], AggregateAttachment[P]>
  }




  export type AttachmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AttachmentWhereInput
    orderBy?: AttachmentOrderByWithAggregationInput | AttachmentOrderByWithAggregationInput[]
    by: AttachmentScalarFieldEnum[] | AttachmentScalarFieldEnum
    having?: AttachmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AttachmentCountAggregateInputType | true
    _avg?: AttachmentAvgAggregateInputType
    _sum?: AttachmentSumAggregateInputType
    _min?: AttachmentMinAggregateInputType
    _max?: AttachmentMaxAggregateInputType
  }

  export type AttachmentGroupByOutputType = {
    id: string
    type: $Enums.AttachmentType
    url: string
    width: number | null
    height: number | null
    size: number
    createdAt: Date
    updatedAt: Date
    messageId: string
    _count: AttachmentCountAggregateOutputType | null
    _avg: AttachmentAvgAggregateOutputType | null
    _sum: AttachmentSumAggregateOutputType | null
    _min: AttachmentMinAggregateOutputType | null
    _max: AttachmentMaxAggregateOutputType | null
  }

  type GetAttachmentGroupByPayload<T extends AttachmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AttachmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AttachmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AttachmentGroupByOutputType[P]>
            : GetScalarType<T[P], AttachmentGroupByOutputType[P]>
        }
      >
    >


  export type AttachmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    url?: boolean
    width?: boolean
    height?: boolean
    size?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messageId?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["attachment"]>

  export type AttachmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    url?: boolean
    width?: boolean
    height?: boolean
    size?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messageId?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["attachment"]>

  export type AttachmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    url?: boolean
    width?: boolean
    height?: boolean
    size?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messageId?: boolean
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["attachment"]>

  export type AttachmentSelectScalar = {
    id?: boolean
    type?: boolean
    url?: boolean
    width?: boolean
    height?: boolean
    size?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messageId?: boolean
  }

  export type AttachmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "url" | "width" | "height" | "size" | "createdAt" | "updatedAt" | "messageId", ExtArgs["result"]["attachment"]>
  export type AttachmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type AttachmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }
  export type AttachmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $AttachmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Attachment"
    objects: {
      Message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.AttachmentType
      url: string
      width: number | null
      height: number | null
      size: number
      createdAt: Date
      updatedAt: Date
      messageId: string
    }, ExtArgs["result"]["attachment"]>
    composites: {}
  }

  type AttachmentGetPayload<S extends boolean | null | undefined | AttachmentDefaultArgs> = $Result.GetResult<Prisma.$AttachmentPayload, S>

  type AttachmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AttachmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AttachmentCountAggregateInputType | true
    }

  export interface AttachmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Attachment'], meta: { name: 'Attachment' } }
    /**
     * Find zero or one Attachment that matches the filter.
     * @param {AttachmentFindUniqueArgs} args - Arguments to find a Attachment
     * @example
     * // Get one Attachment
     * const attachment = await prisma.attachment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AttachmentFindUniqueArgs>(args: SelectSubset<T, AttachmentFindUniqueArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Attachment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AttachmentFindUniqueOrThrowArgs} args - Arguments to find a Attachment
     * @example
     * // Get one Attachment
     * const attachment = await prisma.attachment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AttachmentFindUniqueOrThrowArgs>(args: SelectSubset<T, AttachmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Attachment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentFindFirstArgs} args - Arguments to find a Attachment
     * @example
     * // Get one Attachment
     * const attachment = await prisma.attachment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AttachmentFindFirstArgs>(args?: SelectSubset<T, AttachmentFindFirstArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Attachment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentFindFirstOrThrowArgs} args - Arguments to find a Attachment
     * @example
     * // Get one Attachment
     * const attachment = await prisma.attachment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AttachmentFindFirstOrThrowArgs>(args?: SelectSubset<T, AttachmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Attachments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Attachments
     * const attachments = await prisma.attachment.findMany()
     * 
     * // Get first 10 Attachments
     * const attachments = await prisma.attachment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const attachmentWithIdOnly = await prisma.attachment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AttachmentFindManyArgs>(args?: SelectSubset<T, AttachmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Attachment.
     * @param {AttachmentCreateArgs} args - Arguments to create a Attachment.
     * @example
     * // Create one Attachment
     * const Attachment = await prisma.attachment.create({
     *   data: {
     *     // ... data to create a Attachment
     *   }
     * })
     * 
     */
    create<T extends AttachmentCreateArgs>(args: SelectSubset<T, AttachmentCreateArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Attachments.
     * @param {AttachmentCreateManyArgs} args - Arguments to create many Attachments.
     * @example
     * // Create many Attachments
     * const attachment = await prisma.attachment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AttachmentCreateManyArgs>(args?: SelectSubset<T, AttachmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Attachments and returns the data saved in the database.
     * @param {AttachmentCreateManyAndReturnArgs} args - Arguments to create many Attachments.
     * @example
     * // Create many Attachments
     * const attachment = await prisma.attachment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Attachments and only return the `id`
     * const attachmentWithIdOnly = await prisma.attachment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AttachmentCreateManyAndReturnArgs>(args?: SelectSubset<T, AttachmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Attachment.
     * @param {AttachmentDeleteArgs} args - Arguments to delete one Attachment.
     * @example
     * // Delete one Attachment
     * const Attachment = await prisma.attachment.delete({
     *   where: {
     *     // ... filter to delete one Attachment
     *   }
     * })
     * 
     */
    delete<T extends AttachmentDeleteArgs>(args: SelectSubset<T, AttachmentDeleteArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Attachment.
     * @param {AttachmentUpdateArgs} args - Arguments to update one Attachment.
     * @example
     * // Update one Attachment
     * const attachment = await prisma.attachment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AttachmentUpdateArgs>(args: SelectSubset<T, AttachmentUpdateArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Attachments.
     * @param {AttachmentDeleteManyArgs} args - Arguments to filter Attachments to delete.
     * @example
     * // Delete a few Attachments
     * const { count } = await prisma.attachment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AttachmentDeleteManyArgs>(args?: SelectSubset<T, AttachmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Attachments
     * const attachment = await prisma.attachment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AttachmentUpdateManyArgs>(args: SelectSubset<T, AttachmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Attachments and returns the data updated in the database.
     * @param {AttachmentUpdateManyAndReturnArgs} args - Arguments to update many Attachments.
     * @example
     * // Update many Attachments
     * const attachment = await prisma.attachment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Attachments and only return the `id`
     * const attachmentWithIdOnly = await prisma.attachment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AttachmentUpdateManyAndReturnArgs>(args: SelectSubset<T, AttachmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Attachment.
     * @param {AttachmentUpsertArgs} args - Arguments to update or create a Attachment.
     * @example
     * // Update or create a Attachment
     * const attachment = await prisma.attachment.upsert({
     *   create: {
     *     // ... data to create a Attachment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Attachment we want to update
     *   }
     * })
     */
    upsert<T extends AttachmentUpsertArgs>(args: SelectSubset<T, AttachmentUpsertArgs<ExtArgs>>): Prisma__AttachmentClient<$Result.GetResult<Prisma.$AttachmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentCountArgs} args - Arguments to filter Attachments to count.
     * @example
     * // Count the number of Attachments
     * const count = await prisma.attachment.count({
     *   where: {
     *     // ... the filter for the Attachments we want to count
     *   }
     * })
    **/
    count<T extends AttachmentCountArgs>(
      args?: Subset<T, AttachmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AttachmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Attachment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AttachmentAggregateArgs>(args: Subset<T, AttachmentAggregateArgs>): Prisma.PrismaPromise<GetAttachmentAggregateType<T>>

    /**
     * Group by Attachment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AttachmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AttachmentGroupByArgs['orderBy'] }
        : { orderBy?: AttachmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AttachmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAttachmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Attachment model
   */
  readonly fields: AttachmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Attachment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AttachmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Attachment model
   */
  interface AttachmentFieldRefs {
    readonly id: FieldRef<"Attachment", 'String'>
    readonly type: FieldRef<"Attachment", 'AttachmentType'>
    readonly url: FieldRef<"Attachment", 'String'>
    readonly width: FieldRef<"Attachment", 'Int'>
    readonly height: FieldRef<"Attachment", 'Int'>
    readonly size: FieldRef<"Attachment", 'Int'>
    readonly createdAt: FieldRef<"Attachment", 'DateTime'>
    readonly updatedAt: FieldRef<"Attachment", 'DateTime'>
    readonly messageId: FieldRef<"Attachment", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Attachment findUnique
   */
  export type AttachmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter, which Attachment to fetch.
     */
    where: AttachmentWhereUniqueInput
  }

  /**
   * Attachment findUniqueOrThrow
   */
  export type AttachmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter, which Attachment to fetch.
     */
    where: AttachmentWhereUniqueInput
  }

  /**
   * Attachment findFirst
   */
  export type AttachmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter, which Attachment to fetch.
     */
    where?: AttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentOrderByWithRelationInput | AttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Attachments.
     */
    cursor?: AttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Attachments.
     */
    distinct?: AttachmentScalarFieldEnum | AttachmentScalarFieldEnum[]
  }

  /**
   * Attachment findFirstOrThrow
   */
  export type AttachmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter, which Attachment to fetch.
     */
    where?: AttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentOrderByWithRelationInput | AttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Attachments.
     */
    cursor?: AttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Attachments.
     */
    distinct?: AttachmentScalarFieldEnum | AttachmentScalarFieldEnum[]
  }

  /**
   * Attachment findMany
   */
  export type AttachmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where?: AttachmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentOrderByWithRelationInput | AttachmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Attachments.
     */
    cursor?: AttachmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    distinct?: AttachmentScalarFieldEnum | AttachmentScalarFieldEnum[]
  }

  /**
   * Attachment create
   */
  export type AttachmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * The data needed to create a Attachment.
     */
    data: XOR<AttachmentCreateInput, AttachmentUncheckedCreateInput>
  }

  /**
   * Attachment createMany
   */
  export type AttachmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Attachments.
     */
    data: AttachmentCreateManyInput | AttachmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Attachment createManyAndReturn
   */
  export type AttachmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * The data used to create many Attachments.
     */
    data: AttachmentCreateManyInput | AttachmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Attachment update
   */
  export type AttachmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * The data needed to update a Attachment.
     */
    data: XOR<AttachmentUpdateInput, AttachmentUncheckedUpdateInput>
    /**
     * Choose, which Attachment to update.
     */
    where: AttachmentWhereUniqueInput
  }

  /**
   * Attachment updateMany
   */
  export type AttachmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Attachments.
     */
    data: XOR<AttachmentUpdateManyMutationInput, AttachmentUncheckedUpdateManyInput>
    /**
     * Filter which Attachments to update
     */
    where?: AttachmentWhereInput
    /**
     * Limit how many Attachments to update.
     */
    limit?: number
  }

  /**
   * Attachment updateManyAndReturn
   */
  export type AttachmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * The data used to update Attachments.
     */
    data: XOR<AttachmentUpdateManyMutationInput, AttachmentUncheckedUpdateManyInput>
    /**
     * Filter which Attachments to update
     */
    where?: AttachmentWhereInput
    /**
     * Limit how many Attachments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Attachment upsert
   */
  export type AttachmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * The filter to search for the Attachment to update in case it exists.
     */
    where: AttachmentWhereUniqueInput
    /**
     * In case the Attachment found by the `where` argument doesn't exist, create a new Attachment with this data.
     */
    create: XOR<AttachmentCreateInput, AttachmentUncheckedCreateInput>
    /**
     * In case the Attachment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AttachmentUpdateInput, AttachmentUncheckedUpdateInput>
  }

  /**
   * Attachment delete
   */
  export type AttachmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
    /**
     * Filter which Attachment to delete.
     */
    where: AttachmentWhereUniqueInput
  }

  /**
   * Attachment deleteMany
   */
  export type AttachmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Attachments to delete
     */
    where?: AttachmentWhereInput
    /**
     * Limit how many Attachments to delete.
     */
    limit?: number
  }

  /**
   * Attachment without action
   */
  export type AttachmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachment
     */
    select?: AttachmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachment
     */
    omit?: AttachmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const FragmentScalarFieldEnum: {
    id: 'id',
    messageId: 'messageId',
    sandboxId: 'sandboxId',
    sandboxUrl: 'sandboxUrl',
    title: 'title',
    files: 'files',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    framework: 'framework'
  };

  export type FragmentScalarFieldEnum = (typeof FragmentScalarFieldEnum)[keyof typeof FragmentScalarFieldEnum]


  export const FragmentDraftScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    sandboxId: 'sandboxId',
    sandboxUrl: 'sandboxUrl',
    files: 'files',
    framework: 'framework',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FragmentDraftScalarFieldEnum = (typeof FragmentDraftScalarFieldEnum)[keyof typeof FragmentDraftScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    content: 'content',
    role: 'role',
    type: 'type',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    projectId: 'projectId'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const ProjectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    framework: 'framework'
  };

  export type ProjectScalarFieldEnum = (typeof ProjectScalarFieldEnum)[keyof typeof ProjectScalarFieldEnum]


  export const UsageScalarFieldEnum: {
    key: 'key',
    points: 'points',
    expire: 'expire'
  };

  export type UsageScalarFieldEnum = (typeof UsageScalarFieldEnum)[keyof typeof UsageScalarFieldEnum]


  export const AttachmentScalarFieldEnum: {
    id: 'id',
    type: 'type',
    url: 'url',
    width: 'width',
    height: 'height',
    size: 'size',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    messageId: 'messageId'
  };

  export type AttachmentScalarFieldEnum = (typeof AttachmentScalarFieldEnum)[keyof typeof AttachmentScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Framework'
   */
  export type EnumFrameworkFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Framework'>
    


  /**
   * Reference to a field of type 'Framework[]'
   */
  export type ListEnumFrameworkFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Framework[]'>
    


  /**
   * Reference to a field of type 'MessageRole'
   */
  export type EnumMessageRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageRole'>
    


  /**
   * Reference to a field of type 'MessageRole[]'
   */
  export type ListEnumMessageRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageRole[]'>
    


  /**
   * Reference to a field of type 'MessageType'
   */
  export type EnumMessageTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageType'>
    


  /**
   * Reference to a field of type 'MessageType[]'
   */
  export type ListEnumMessageTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageType[]'>
    


  /**
   * Reference to a field of type 'MessageStatus'
   */
  export type EnumMessageStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageStatus'>
    


  /**
   * Reference to a field of type 'MessageStatus[]'
   */
  export type ListEnumMessageStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'AttachmentType'
   */
  export type EnumAttachmentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AttachmentType'>
    


  /**
   * Reference to a field of type 'AttachmentType[]'
   */
  export type ListEnumAttachmentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AttachmentType[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type FragmentWhereInput = {
    AND?: FragmentWhereInput | FragmentWhereInput[]
    OR?: FragmentWhereInput[]
    NOT?: FragmentWhereInput | FragmentWhereInput[]
    id?: StringFilter<"Fragment"> | string
    messageId?: StringFilter<"Fragment"> | string
    sandboxId?: StringNullableFilter<"Fragment"> | string | null
    sandboxUrl?: StringFilter<"Fragment"> | string
    title?: StringFilter<"Fragment"> | string
    files?: JsonFilter<"Fragment">
    metadata?: JsonNullableFilter<"Fragment">
    createdAt?: DateTimeFilter<"Fragment"> | Date | string
    updatedAt?: DateTimeFilter<"Fragment"> | Date | string
    framework?: EnumFrameworkFilter<"Fragment"> | $Enums.Framework
    Message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type FragmentOrderByWithRelationInput = {
    id?: SortOrder
    messageId?: SortOrder
    sandboxId?: SortOrderInput | SortOrder
    sandboxUrl?: SortOrder
    title?: SortOrder
    files?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
    Message?: MessageOrderByWithRelationInput
  }

  export type FragmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    messageId?: string
    AND?: FragmentWhereInput | FragmentWhereInput[]
    OR?: FragmentWhereInput[]
    NOT?: FragmentWhereInput | FragmentWhereInput[]
    sandboxId?: StringNullableFilter<"Fragment"> | string | null
    sandboxUrl?: StringFilter<"Fragment"> | string
    title?: StringFilter<"Fragment"> | string
    files?: JsonFilter<"Fragment">
    metadata?: JsonNullableFilter<"Fragment">
    createdAt?: DateTimeFilter<"Fragment"> | Date | string
    updatedAt?: DateTimeFilter<"Fragment"> | Date | string
    framework?: EnumFrameworkFilter<"Fragment"> | $Enums.Framework
    Message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id" | "messageId">

  export type FragmentOrderByWithAggregationInput = {
    id?: SortOrder
    messageId?: SortOrder
    sandboxId?: SortOrderInput | SortOrder
    sandboxUrl?: SortOrder
    title?: SortOrder
    files?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
    _count?: FragmentCountOrderByAggregateInput
    _max?: FragmentMaxOrderByAggregateInput
    _min?: FragmentMinOrderByAggregateInput
  }

  export type FragmentScalarWhereWithAggregatesInput = {
    AND?: FragmentScalarWhereWithAggregatesInput | FragmentScalarWhereWithAggregatesInput[]
    OR?: FragmentScalarWhereWithAggregatesInput[]
    NOT?: FragmentScalarWhereWithAggregatesInput | FragmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Fragment"> | string
    messageId?: StringWithAggregatesFilter<"Fragment"> | string
    sandboxId?: StringNullableWithAggregatesFilter<"Fragment"> | string | null
    sandboxUrl?: StringWithAggregatesFilter<"Fragment"> | string
    title?: StringWithAggregatesFilter<"Fragment"> | string
    files?: JsonWithAggregatesFilter<"Fragment">
    metadata?: JsonNullableWithAggregatesFilter<"Fragment">
    createdAt?: DateTimeWithAggregatesFilter<"Fragment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Fragment"> | Date | string
    framework?: EnumFrameworkWithAggregatesFilter<"Fragment"> | $Enums.Framework
  }

  export type FragmentDraftWhereInput = {
    AND?: FragmentDraftWhereInput | FragmentDraftWhereInput[]
    OR?: FragmentDraftWhereInput[]
    NOT?: FragmentDraftWhereInput | FragmentDraftWhereInput[]
    id?: StringFilter<"FragmentDraft"> | string
    projectId?: StringFilter<"FragmentDraft"> | string
    sandboxId?: StringNullableFilter<"FragmentDraft"> | string | null
    sandboxUrl?: StringNullableFilter<"FragmentDraft"> | string | null
    files?: JsonFilter<"FragmentDraft">
    framework?: EnumFrameworkFilter<"FragmentDraft"> | $Enums.Framework
    createdAt?: DateTimeFilter<"FragmentDraft"> | Date | string
    updatedAt?: DateTimeFilter<"FragmentDraft"> | Date | string
    Project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }

  export type FragmentDraftOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    sandboxId?: SortOrderInput | SortOrder
    sandboxUrl?: SortOrderInput | SortOrder
    files?: SortOrder
    framework?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    Project?: ProjectOrderByWithRelationInput
  }

  export type FragmentDraftWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId?: string
    AND?: FragmentDraftWhereInput | FragmentDraftWhereInput[]
    OR?: FragmentDraftWhereInput[]
    NOT?: FragmentDraftWhereInput | FragmentDraftWhereInput[]
    sandboxId?: StringNullableFilter<"FragmentDraft"> | string | null
    sandboxUrl?: StringNullableFilter<"FragmentDraft"> | string | null
    files?: JsonFilter<"FragmentDraft">
    framework?: EnumFrameworkFilter<"FragmentDraft"> | $Enums.Framework
    createdAt?: DateTimeFilter<"FragmentDraft"> | Date | string
    updatedAt?: DateTimeFilter<"FragmentDraft"> | Date | string
    Project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }, "id" | "projectId">

  export type FragmentDraftOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    sandboxId?: SortOrderInput | SortOrder
    sandboxUrl?: SortOrderInput | SortOrder
    files?: SortOrder
    framework?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FragmentDraftCountOrderByAggregateInput
    _max?: FragmentDraftMaxOrderByAggregateInput
    _min?: FragmentDraftMinOrderByAggregateInput
  }

  export type FragmentDraftScalarWhereWithAggregatesInput = {
    AND?: FragmentDraftScalarWhereWithAggregatesInput | FragmentDraftScalarWhereWithAggregatesInput[]
    OR?: FragmentDraftScalarWhereWithAggregatesInput[]
    NOT?: FragmentDraftScalarWhereWithAggregatesInput | FragmentDraftScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FragmentDraft"> | string
    projectId?: StringWithAggregatesFilter<"FragmentDraft"> | string
    sandboxId?: StringNullableWithAggregatesFilter<"FragmentDraft"> | string | null
    sandboxUrl?: StringNullableWithAggregatesFilter<"FragmentDraft"> | string | null
    files?: JsonWithAggregatesFilter<"FragmentDraft">
    framework?: EnumFrameworkWithAggregatesFilter<"FragmentDraft"> | $Enums.Framework
    createdAt?: DateTimeWithAggregatesFilter<"FragmentDraft"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"FragmentDraft"> | Date | string
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    role?: EnumMessageRoleFilter<"Message"> | $Enums.MessageRole
    type?: EnumMessageTypeFilter<"Message"> | $Enums.MessageType
    status?: EnumMessageStatusFilter<"Message"> | $Enums.MessageStatus
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    projectId?: StringFilter<"Message"> | string
    Fragment?: XOR<FragmentNullableScalarRelationFilter, FragmentWhereInput> | null
    Attachment?: AttachmentListRelationFilter
    Project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    type?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    projectId?: SortOrder
    Fragment?: FragmentOrderByWithRelationInput
    Attachment?: AttachmentOrderByRelationAggregateInput
    Project?: ProjectOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    content?: StringFilter<"Message"> | string
    role?: EnumMessageRoleFilter<"Message"> | $Enums.MessageRole
    type?: EnumMessageTypeFilter<"Message"> | $Enums.MessageType
    status?: EnumMessageStatusFilter<"Message"> | $Enums.MessageStatus
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    projectId?: StringFilter<"Message"> | string
    Fragment?: XOR<FragmentNullableScalarRelationFilter, FragmentWhereInput> | null
    Attachment?: AttachmentListRelationFilter
    Project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    type?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    projectId?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    content?: StringWithAggregatesFilter<"Message"> | string
    role?: EnumMessageRoleWithAggregatesFilter<"Message"> | $Enums.MessageRole
    type?: EnumMessageTypeWithAggregatesFilter<"Message"> | $Enums.MessageType
    status?: EnumMessageStatusWithAggregatesFilter<"Message"> | $Enums.MessageStatus
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    projectId?: StringWithAggregatesFilter<"Message"> | string
  }

  export type ProjectWhereInput = {
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    id?: StringFilter<"Project"> | string
    name?: StringFilter<"Project"> | string
    userId?: StringFilter<"Project"> | string
    createdAt?: DateTimeFilter<"Project"> | Date | string
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    framework?: EnumFrameworkFilter<"Project"> | $Enums.Framework
    FragmentDraft?: XOR<FragmentDraftNullableScalarRelationFilter, FragmentDraftWhereInput> | null
    Message?: MessageListRelationFilter
  }

  export type ProjectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
    FragmentDraft?: FragmentDraftOrderByWithRelationInput
    Message?: MessageOrderByRelationAggregateInput
  }

  export type ProjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    name?: StringFilter<"Project"> | string
    userId?: StringFilter<"Project"> | string
    createdAt?: DateTimeFilter<"Project"> | Date | string
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    framework?: EnumFrameworkFilter<"Project"> | $Enums.Framework
    FragmentDraft?: XOR<FragmentDraftNullableScalarRelationFilter, FragmentDraftWhereInput> | null
    Message?: MessageListRelationFilter
  }, "id">

  export type ProjectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
    _count?: ProjectCountOrderByAggregateInput
    _max?: ProjectMaxOrderByAggregateInput
    _min?: ProjectMinOrderByAggregateInput
  }

  export type ProjectScalarWhereWithAggregatesInput = {
    AND?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    OR?: ProjectScalarWhereWithAggregatesInput[]
    NOT?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Project"> | string
    name?: StringWithAggregatesFilter<"Project"> | string
    userId?: StringWithAggregatesFilter<"Project"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    framework?: EnumFrameworkWithAggregatesFilter<"Project"> | $Enums.Framework
  }

  export type UsageWhereInput = {
    AND?: UsageWhereInput | UsageWhereInput[]
    OR?: UsageWhereInput[]
    NOT?: UsageWhereInput | UsageWhereInput[]
    key?: StringFilter<"Usage"> | string
    points?: IntFilter<"Usage"> | number
    expire?: DateTimeNullableFilter<"Usage"> | Date | string | null
  }

  export type UsageOrderByWithRelationInput = {
    key?: SortOrder
    points?: SortOrder
    expire?: SortOrderInput | SortOrder
  }

  export type UsageWhereUniqueInput = Prisma.AtLeast<{
    key?: string
    AND?: UsageWhereInput | UsageWhereInput[]
    OR?: UsageWhereInput[]
    NOT?: UsageWhereInput | UsageWhereInput[]
    points?: IntFilter<"Usage"> | number
    expire?: DateTimeNullableFilter<"Usage"> | Date | string | null
  }, "key">

  export type UsageOrderByWithAggregationInput = {
    key?: SortOrder
    points?: SortOrder
    expire?: SortOrderInput | SortOrder
    _count?: UsageCountOrderByAggregateInput
    _avg?: UsageAvgOrderByAggregateInput
    _max?: UsageMaxOrderByAggregateInput
    _min?: UsageMinOrderByAggregateInput
    _sum?: UsageSumOrderByAggregateInput
  }

  export type UsageScalarWhereWithAggregatesInput = {
    AND?: UsageScalarWhereWithAggregatesInput | UsageScalarWhereWithAggregatesInput[]
    OR?: UsageScalarWhereWithAggregatesInput[]
    NOT?: UsageScalarWhereWithAggregatesInput | UsageScalarWhereWithAggregatesInput[]
    key?: StringWithAggregatesFilter<"Usage"> | string
    points?: IntWithAggregatesFilter<"Usage"> | number
    expire?: DateTimeNullableWithAggregatesFilter<"Usage"> | Date | string | null
  }

  export type AttachmentWhereInput = {
    AND?: AttachmentWhereInput | AttachmentWhereInput[]
    OR?: AttachmentWhereInput[]
    NOT?: AttachmentWhereInput | AttachmentWhereInput[]
    id?: StringFilter<"Attachment"> | string
    type?: EnumAttachmentTypeFilter<"Attachment"> | $Enums.AttachmentType
    url?: StringFilter<"Attachment"> | string
    width?: IntNullableFilter<"Attachment"> | number | null
    height?: IntNullableFilter<"Attachment"> | number | null
    size?: IntFilter<"Attachment"> | number
    createdAt?: DateTimeFilter<"Attachment"> | Date | string
    updatedAt?: DateTimeFilter<"Attachment"> | Date | string
    messageId?: StringFilter<"Attachment"> | string
    Message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type AttachmentOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    url?: SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    size?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messageId?: SortOrder
    Message?: MessageOrderByWithRelationInput
  }

  export type AttachmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AttachmentWhereInput | AttachmentWhereInput[]
    OR?: AttachmentWhereInput[]
    NOT?: AttachmentWhereInput | AttachmentWhereInput[]
    type?: EnumAttachmentTypeFilter<"Attachment"> | $Enums.AttachmentType
    url?: StringFilter<"Attachment"> | string
    width?: IntNullableFilter<"Attachment"> | number | null
    height?: IntNullableFilter<"Attachment"> | number | null
    size?: IntFilter<"Attachment"> | number
    createdAt?: DateTimeFilter<"Attachment"> | Date | string
    updatedAt?: DateTimeFilter<"Attachment"> | Date | string
    messageId?: StringFilter<"Attachment"> | string
    Message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id">

  export type AttachmentOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    url?: SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    size?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messageId?: SortOrder
    _count?: AttachmentCountOrderByAggregateInput
    _avg?: AttachmentAvgOrderByAggregateInput
    _max?: AttachmentMaxOrderByAggregateInput
    _min?: AttachmentMinOrderByAggregateInput
    _sum?: AttachmentSumOrderByAggregateInput
  }

  export type AttachmentScalarWhereWithAggregatesInput = {
    AND?: AttachmentScalarWhereWithAggregatesInput | AttachmentScalarWhereWithAggregatesInput[]
    OR?: AttachmentScalarWhereWithAggregatesInput[]
    NOT?: AttachmentScalarWhereWithAggregatesInput | AttachmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Attachment"> | string
    type?: EnumAttachmentTypeWithAggregatesFilter<"Attachment"> | $Enums.AttachmentType
    url?: StringWithAggregatesFilter<"Attachment"> | string
    width?: IntNullableWithAggregatesFilter<"Attachment"> | number | null
    height?: IntNullableWithAggregatesFilter<"Attachment"> | number | null
    size?: IntWithAggregatesFilter<"Attachment"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Attachment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Attachment"> | Date | string
    messageId?: StringWithAggregatesFilter<"Attachment"> | string
  }

  export type FragmentCreateInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl: string
    title: string
    files: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    Message: MessageCreateNestedOneWithoutFragmentInput
  }

  export type FragmentUncheckedCreateInput = {
    id?: string
    messageId: string
    sandboxId?: string | null
    sandboxUrl: string
    title: string
    files: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
  }

  export type FragmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    Message?: MessageUpdateOneRequiredWithoutFragmentNestedInput
  }

  export type FragmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type FragmentCreateManyInput = {
    id?: string
    messageId: string
    sandboxId?: string | null
    sandboxUrl: string
    title: string
    files: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
  }

  export type FragmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type FragmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type FragmentDraftCreateInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl?: string | null
    files: JsonNullValueInput | InputJsonValue
    framework?: $Enums.Framework
    createdAt?: Date | string
    updatedAt?: Date | string
    Project: ProjectCreateNestedOneWithoutFragmentDraftInput
  }

  export type FragmentDraftUncheckedCreateInput = {
    id?: string
    projectId: string
    sandboxId?: string | null
    sandboxUrl?: string | null
    files: JsonNullValueInput | InputJsonValue
    framework?: $Enums.Framework
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FragmentDraftUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Project?: ProjectUpdateOneRequiredWithoutFragmentDraftNestedInput
  }

  export type FragmentDraftUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FragmentDraftCreateManyInput = {
    id?: string
    projectId: string
    sandboxId?: string | null
    sandboxUrl?: string | null
    files: JsonNullValueInput | InputJsonValue
    framework?: $Enums.Framework
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FragmentDraftUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FragmentDraftUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    Fragment?: FragmentCreateNestedOneWithoutMessageInput
    Attachment?: AttachmentCreateNestedManyWithoutMessageInput
    Project: ProjectCreateNestedOneWithoutMessageInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    projectId: string
    Fragment?: FragmentUncheckedCreateNestedOneWithoutMessageInput
    Attachment?: AttachmentUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Fragment?: FragmentUpdateOneWithoutMessageNestedInput
    Attachment?: AttachmentUpdateManyWithoutMessageNestedInput
    Project?: ProjectUpdateOneRequiredWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    projectId?: StringFieldUpdateOperationsInput | string
    Fragment?: FragmentUncheckedUpdateOneWithoutMessageNestedInput
    Attachment?: AttachmentUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageCreateManyInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    projectId: string
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    projectId?: StringFieldUpdateOperationsInput | string
  }

  export type ProjectCreateInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    FragmentDraft?: FragmentDraftCreateNestedOneWithoutProjectInput
    Message?: MessageCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    FragmentDraft?: FragmentDraftUncheckedCreateNestedOneWithoutProjectInput
    Message?: MessageUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    FragmentDraft?: FragmentDraftUpdateOneWithoutProjectNestedInput
    Message?: MessageUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    FragmentDraft?: FragmentDraftUncheckedUpdateOneWithoutProjectNestedInput
    Message?: MessageUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectCreateManyInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
  }

  export type ProjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type ProjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type UsageCreateInput = {
    key: string
    points: number
    expire?: Date | string | null
  }

  export type UsageUncheckedCreateInput = {
    key: string
    points: number
    expire?: Date | string | null
  }

  export type UsageUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    expire?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UsageUncheckedUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    expire?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UsageCreateManyInput = {
    key: string
    points: number
    expire?: Date | string | null
  }

  export type UsageUpdateManyMutationInput = {
    key?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    expire?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UsageUncheckedUpdateManyInput = {
    key?: StringFieldUpdateOperationsInput | string
    points?: IntFieldUpdateOperationsInput | number
    expire?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AttachmentCreateInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
    Message: MessageCreateNestedOneWithoutAttachmentInput
  }

  export type AttachmentUncheckedCreateInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
    messageId: string
  }

  export type AttachmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Message?: MessageUpdateOneRequiredWithoutAttachmentNestedInput
  }

  export type AttachmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: StringFieldUpdateOperationsInput | string
  }

  export type AttachmentCreateManyInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
    messageId: string
  }

  export type AttachmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumFrameworkFilter<$PrismaModel = never> = {
    equals?: $Enums.Framework | EnumFrameworkFieldRefInput<$PrismaModel>
    in?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    notIn?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    not?: NestedEnumFrameworkFilter<$PrismaModel> | $Enums.Framework
  }

  export type MessageScalarRelationFilter = {
    is?: MessageWhereInput
    isNot?: MessageWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type FragmentCountOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    title?: SortOrder
    files?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type FragmentMaxOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type FragmentMinOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumFrameworkWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Framework | EnumFrameworkFieldRefInput<$PrismaModel>
    in?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    notIn?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    not?: NestedEnumFrameworkWithAggregatesFilter<$PrismaModel> | $Enums.Framework
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFrameworkFilter<$PrismaModel>
    _max?: NestedEnumFrameworkFilter<$PrismaModel>
  }

  export type ProjectScalarRelationFilter = {
    is?: ProjectWhereInput
    isNot?: ProjectWhereInput
  }

  export type FragmentDraftCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    files?: SortOrder
    framework?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FragmentDraftMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    framework?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FragmentDraftMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    sandboxId?: SortOrder
    sandboxUrl?: SortOrder
    framework?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumMessageRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleFilter<$PrismaModel> | $Enums.MessageRole
  }

  export type EnumMessageTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageType | EnumMessageTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageTypeFilter<$PrismaModel> | $Enums.MessageType
  }

  export type EnumMessageStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageStatus | EnumMessageStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageStatusFilter<$PrismaModel> | $Enums.MessageStatus
  }

  export type FragmentNullableScalarRelationFilter = {
    is?: FragmentWhereInput | null
    isNot?: FragmentWhereInput | null
  }

  export type AttachmentListRelationFilter = {
    every?: AttachmentWhereInput
    some?: AttachmentWhereInput
    none?: AttachmentWhereInput
  }

  export type AttachmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    type?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    projectId?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    type?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    projectId?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    type?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    projectId?: SortOrder
  }

  export type EnumMessageRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel> | $Enums.MessageRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageRoleFilter<$PrismaModel>
    _max?: NestedEnumMessageRoleFilter<$PrismaModel>
  }

  export type EnumMessageTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageType | EnumMessageTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageTypeWithAggregatesFilter<$PrismaModel> | $Enums.MessageType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageTypeFilter<$PrismaModel>
    _max?: NestedEnumMessageTypeFilter<$PrismaModel>
  }

  export type EnumMessageStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageStatus | EnumMessageStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageStatusWithAggregatesFilter<$PrismaModel> | $Enums.MessageStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageStatusFilter<$PrismaModel>
    _max?: NestedEnumMessageStatusFilter<$PrismaModel>
  }

  export type FragmentDraftNullableScalarRelationFilter = {
    is?: FragmentDraftWhereInput | null
    isNot?: FragmentDraftWhereInput | null
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProjectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type ProjectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type ProjectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    framework?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type UsageCountOrderByAggregateInput = {
    key?: SortOrder
    points?: SortOrder
    expire?: SortOrder
  }

  export type UsageAvgOrderByAggregateInput = {
    points?: SortOrder
  }

  export type UsageMaxOrderByAggregateInput = {
    key?: SortOrder
    points?: SortOrder
    expire?: SortOrder
  }

  export type UsageMinOrderByAggregateInput = {
    key?: SortOrder
    points?: SortOrder
    expire?: SortOrder
  }

  export type UsageSumOrderByAggregateInput = {
    points?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumAttachmentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AttachmentType | EnumAttachmentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAttachmentTypeFilter<$PrismaModel> | $Enums.AttachmentType
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type AttachmentCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    url?: SortOrder
    width?: SortOrder
    height?: SortOrder
    size?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentAvgOrderByAggregateInput = {
    width?: SortOrder
    height?: SortOrder
    size?: SortOrder
  }

  export type AttachmentMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    url?: SortOrder
    width?: SortOrder
    height?: SortOrder
    size?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    url?: SortOrder
    width?: SortOrder
    height?: SortOrder
    size?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentSumOrderByAggregateInput = {
    width?: SortOrder
    height?: SortOrder
    size?: SortOrder
  }

  export type EnumAttachmentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AttachmentType | EnumAttachmentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAttachmentTypeWithAggregatesFilter<$PrismaModel> | $Enums.AttachmentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAttachmentTypeFilter<$PrismaModel>
    _max?: NestedEnumAttachmentTypeFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type MessageCreateNestedOneWithoutFragmentInput = {
    create?: XOR<MessageCreateWithoutFragmentInput, MessageUncheckedCreateWithoutFragmentInput>
    connectOrCreate?: MessageCreateOrConnectWithoutFragmentInput
    connect?: MessageWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumFrameworkFieldUpdateOperationsInput = {
    set?: $Enums.Framework
  }

  export type MessageUpdateOneRequiredWithoutFragmentNestedInput = {
    create?: XOR<MessageCreateWithoutFragmentInput, MessageUncheckedCreateWithoutFragmentInput>
    connectOrCreate?: MessageCreateOrConnectWithoutFragmentInput
    upsert?: MessageUpsertWithoutFragmentInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutFragmentInput, MessageUpdateWithoutFragmentInput>, MessageUncheckedUpdateWithoutFragmentInput>
  }

  export type ProjectCreateNestedOneWithoutFragmentDraftInput = {
    create?: XOR<ProjectCreateWithoutFragmentDraftInput, ProjectUncheckedCreateWithoutFragmentDraftInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutFragmentDraftInput
    connect?: ProjectWhereUniqueInput
  }

  export type ProjectUpdateOneRequiredWithoutFragmentDraftNestedInput = {
    create?: XOR<ProjectCreateWithoutFragmentDraftInput, ProjectUncheckedCreateWithoutFragmentDraftInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutFragmentDraftInput
    upsert?: ProjectUpsertWithoutFragmentDraftInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutFragmentDraftInput, ProjectUpdateWithoutFragmentDraftInput>, ProjectUncheckedUpdateWithoutFragmentDraftInput>
  }

  export type FragmentCreateNestedOneWithoutMessageInput = {
    create?: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
    connectOrCreate?: FragmentCreateOrConnectWithoutMessageInput
    connect?: FragmentWhereUniqueInput
  }

  export type AttachmentCreateNestedManyWithoutMessageInput = {
    create?: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput> | AttachmentCreateWithoutMessageInput[] | AttachmentUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentCreateOrConnectWithoutMessageInput | AttachmentCreateOrConnectWithoutMessageInput[]
    createMany?: AttachmentCreateManyMessageInputEnvelope
    connect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
  }

  export type ProjectCreateNestedOneWithoutMessageInput = {
    create?: XOR<ProjectCreateWithoutMessageInput, ProjectUncheckedCreateWithoutMessageInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutMessageInput
    connect?: ProjectWhereUniqueInput
  }

  export type FragmentUncheckedCreateNestedOneWithoutMessageInput = {
    create?: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
    connectOrCreate?: FragmentCreateOrConnectWithoutMessageInput
    connect?: FragmentWhereUniqueInput
  }

  export type AttachmentUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput> | AttachmentCreateWithoutMessageInput[] | AttachmentUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentCreateOrConnectWithoutMessageInput | AttachmentCreateOrConnectWithoutMessageInput[]
    createMany?: AttachmentCreateManyMessageInputEnvelope
    connect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
  }

  export type EnumMessageRoleFieldUpdateOperationsInput = {
    set?: $Enums.MessageRole
  }

  export type EnumMessageTypeFieldUpdateOperationsInput = {
    set?: $Enums.MessageType
  }

  export type EnumMessageStatusFieldUpdateOperationsInput = {
    set?: $Enums.MessageStatus
  }

  export type FragmentUpdateOneWithoutMessageNestedInput = {
    create?: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
    connectOrCreate?: FragmentCreateOrConnectWithoutMessageInput
    upsert?: FragmentUpsertWithoutMessageInput
    disconnect?: FragmentWhereInput | boolean
    delete?: FragmentWhereInput | boolean
    connect?: FragmentWhereUniqueInput
    update?: XOR<XOR<FragmentUpdateToOneWithWhereWithoutMessageInput, FragmentUpdateWithoutMessageInput>, FragmentUncheckedUpdateWithoutMessageInput>
  }

  export type AttachmentUpdateManyWithoutMessageNestedInput = {
    create?: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput> | AttachmentCreateWithoutMessageInput[] | AttachmentUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentCreateOrConnectWithoutMessageInput | AttachmentCreateOrConnectWithoutMessageInput[]
    upsert?: AttachmentUpsertWithWhereUniqueWithoutMessageInput | AttachmentUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: AttachmentCreateManyMessageInputEnvelope
    set?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    disconnect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    delete?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    connect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    update?: AttachmentUpdateWithWhereUniqueWithoutMessageInput | AttachmentUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: AttachmentUpdateManyWithWhereWithoutMessageInput | AttachmentUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: AttachmentScalarWhereInput | AttachmentScalarWhereInput[]
  }

  export type ProjectUpdateOneRequiredWithoutMessageNestedInput = {
    create?: XOR<ProjectCreateWithoutMessageInput, ProjectUncheckedCreateWithoutMessageInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutMessageInput
    upsert?: ProjectUpsertWithoutMessageInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutMessageInput, ProjectUpdateWithoutMessageInput>, ProjectUncheckedUpdateWithoutMessageInput>
  }

  export type FragmentUncheckedUpdateOneWithoutMessageNestedInput = {
    create?: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
    connectOrCreate?: FragmentCreateOrConnectWithoutMessageInput
    upsert?: FragmentUpsertWithoutMessageInput
    disconnect?: FragmentWhereInput | boolean
    delete?: FragmentWhereInput | boolean
    connect?: FragmentWhereUniqueInput
    update?: XOR<XOR<FragmentUpdateToOneWithWhereWithoutMessageInput, FragmentUpdateWithoutMessageInput>, FragmentUncheckedUpdateWithoutMessageInput>
  }

  export type AttachmentUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput> | AttachmentCreateWithoutMessageInput[] | AttachmentUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentCreateOrConnectWithoutMessageInput | AttachmentCreateOrConnectWithoutMessageInput[]
    upsert?: AttachmentUpsertWithWhereUniqueWithoutMessageInput | AttachmentUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: AttachmentCreateManyMessageInputEnvelope
    set?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    disconnect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    delete?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    connect?: AttachmentWhereUniqueInput | AttachmentWhereUniqueInput[]
    update?: AttachmentUpdateWithWhereUniqueWithoutMessageInput | AttachmentUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: AttachmentUpdateManyWithWhereWithoutMessageInput | AttachmentUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: AttachmentScalarWhereInput | AttachmentScalarWhereInput[]
  }

  export type FragmentDraftCreateNestedOneWithoutProjectInput = {
    create?: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
    connectOrCreate?: FragmentDraftCreateOrConnectWithoutProjectInput
    connect?: FragmentDraftWhereUniqueInput
  }

  export type MessageCreateNestedManyWithoutProjectInput = {
    create?: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput> | MessageCreateWithoutProjectInput[] | MessageUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutProjectInput | MessageCreateOrConnectWithoutProjectInput[]
    createMany?: MessageCreateManyProjectInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type FragmentDraftUncheckedCreateNestedOneWithoutProjectInput = {
    create?: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
    connectOrCreate?: FragmentDraftCreateOrConnectWithoutProjectInput
    connect?: FragmentDraftWhereUniqueInput
  }

  export type MessageUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput> | MessageCreateWithoutProjectInput[] | MessageUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutProjectInput | MessageCreateOrConnectWithoutProjectInput[]
    createMany?: MessageCreateManyProjectInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type FragmentDraftUpdateOneWithoutProjectNestedInput = {
    create?: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
    connectOrCreate?: FragmentDraftCreateOrConnectWithoutProjectInput
    upsert?: FragmentDraftUpsertWithoutProjectInput
    disconnect?: FragmentDraftWhereInput | boolean
    delete?: FragmentDraftWhereInput | boolean
    connect?: FragmentDraftWhereUniqueInput
    update?: XOR<XOR<FragmentDraftUpdateToOneWithWhereWithoutProjectInput, FragmentDraftUpdateWithoutProjectInput>, FragmentDraftUncheckedUpdateWithoutProjectInput>
  }

  export type MessageUpdateManyWithoutProjectNestedInput = {
    create?: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput> | MessageCreateWithoutProjectInput[] | MessageUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutProjectInput | MessageCreateOrConnectWithoutProjectInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutProjectInput | MessageUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: MessageCreateManyProjectInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutProjectInput | MessageUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutProjectInput | MessageUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type FragmentDraftUncheckedUpdateOneWithoutProjectNestedInput = {
    create?: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
    connectOrCreate?: FragmentDraftCreateOrConnectWithoutProjectInput
    upsert?: FragmentDraftUpsertWithoutProjectInput
    disconnect?: FragmentDraftWhereInput | boolean
    delete?: FragmentDraftWhereInput | boolean
    connect?: FragmentDraftWhereUniqueInput
    update?: XOR<XOR<FragmentDraftUpdateToOneWithWhereWithoutProjectInput, FragmentDraftUpdateWithoutProjectInput>, FragmentDraftUncheckedUpdateWithoutProjectInput>
  }

  export type MessageUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput> | MessageCreateWithoutProjectInput[] | MessageUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutProjectInput | MessageCreateOrConnectWithoutProjectInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutProjectInput | MessageUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: MessageCreateManyProjectInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutProjectInput | MessageUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutProjectInput | MessageUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type MessageCreateNestedOneWithoutAttachmentInput = {
    create?: XOR<MessageCreateWithoutAttachmentInput, MessageUncheckedCreateWithoutAttachmentInput>
    connectOrCreate?: MessageCreateOrConnectWithoutAttachmentInput
    connect?: MessageWhereUniqueInput
  }

  export type EnumAttachmentTypeFieldUpdateOperationsInput = {
    set?: $Enums.AttachmentType
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MessageUpdateOneRequiredWithoutAttachmentNestedInput = {
    create?: XOR<MessageCreateWithoutAttachmentInput, MessageUncheckedCreateWithoutAttachmentInput>
    connectOrCreate?: MessageCreateOrConnectWithoutAttachmentInput
    upsert?: MessageUpsertWithoutAttachmentInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutAttachmentInput, MessageUpdateWithoutAttachmentInput>, MessageUncheckedUpdateWithoutAttachmentInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumFrameworkFilter<$PrismaModel = never> = {
    equals?: $Enums.Framework | EnumFrameworkFieldRefInput<$PrismaModel>
    in?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    notIn?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    not?: NestedEnumFrameworkFilter<$PrismaModel> | $Enums.Framework
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumFrameworkWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Framework | EnumFrameworkFieldRefInput<$PrismaModel>
    in?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    notIn?: $Enums.Framework[] | ListEnumFrameworkFieldRefInput<$PrismaModel>
    not?: NestedEnumFrameworkWithAggregatesFilter<$PrismaModel> | $Enums.Framework
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFrameworkFilter<$PrismaModel>
    _max?: NestedEnumFrameworkFilter<$PrismaModel>
  }

  export type NestedEnumMessageRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleFilter<$PrismaModel> | $Enums.MessageRole
  }

  export type NestedEnumMessageTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageType | EnumMessageTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageTypeFilter<$PrismaModel> | $Enums.MessageType
  }

  export type NestedEnumMessageStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageStatus | EnumMessageStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageStatusFilter<$PrismaModel> | $Enums.MessageStatus
  }

  export type NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageRole | EnumMessageRoleFieldRefInput<$PrismaModel>
    in?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageRole[] | ListEnumMessageRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageRoleWithAggregatesFilter<$PrismaModel> | $Enums.MessageRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageRoleFilter<$PrismaModel>
    _max?: NestedEnumMessageRoleFilter<$PrismaModel>
  }

  export type NestedEnumMessageTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageType | EnumMessageTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageType[] | ListEnumMessageTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageTypeWithAggregatesFilter<$PrismaModel> | $Enums.MessageType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageTypeFilter<$PrismaModel>
    _max?: NestedEnumMessageTypeFilter<$PrismaModel>
  }

  export type NestedEnumMessageStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageStatus | EnumMessageStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.MessageStatus[] | ListEnumMessageStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumMessageStatusWithAggregatesFilter<$PrismaModel> | $Enums.MessageStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMessageStatusFilter<$PrismaModel>
    _max?: NestedEnumMessageStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumAttachmentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AttachmentType | EnumAttachmentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAttachmentTypeFilter<$PrismaModel> | $Enums.AttachmentType
  }

  export type NestedEnumAttachmentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AttachmentType | EnumAttachmentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AttachmentType[] | ListEnumAttachmentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAttachmentTypeWithAggregatesFilter<$PrismaModel> | $Enums.AttachmentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAttachmentTypeFilter<$PrismaModel>
    _max?: NestedEnumAttachmentTypeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type MessageCreateWithoutFragmentInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    Attachment?: AttachmentCreateNestedManyWithoutMessageInput
    Project: ProjectCreateNestedOneWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutFragmentInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    projectId: string
    Attachment?: AttachmentUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutFragmentInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutFragmentInput, MessageUncheckedCreateWithoutFragmentInput>
  }

  export type MessageUpsertWithoutFragmentInput = {
    update: XOR<MessageUpdateWithoutFragmentInput, MessageUncheckedUpdateWithoutFragmentInput>
    create: XOR<MessageCreateWithoutFragmentInput, MessageUncheckedCreateWithoutFragmentInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutFragmentInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutFragmentInput, MessageUncheckedUpdateWithoutFragmentInput>
  }

  export type MessageUpdateWithoutFragmentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Attachment?: AttachmentUpdateManyWithoutMessageNestedInput
    Project?: ProjectUpdateOneRequiredWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutFragmentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    projectId?: StringFieldUpdateOperationsInput | string
    Attachment?: AttachmentUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type ProjectCreateWithoutFragmentDraftInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    Message?: MessageCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutFragmentDraftInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    Message?: MessageUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutFragmentDraftInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutFragmentDraftInput, ProjectUncheckedCreateWithoutFragmentDraftInput>
  }

  export type ProjectUpsertWithoutFragmentDraftInput = {
    update: XOR<ProjectUpdateWithoutFragmentDraftInput, ProjectUncheckedUpdateWithoutFragmentDraftInput>
    create: XOR<ProjectCreateWithoutFragmentDraftInput, ProjectUncheckedCreateWithoutFragmentDraftInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutFragmentDraftInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutFragmentDraftInput, ProjectUncheckedUpdateWithoutFragmentDraftInput>
  }

  export type ProjectUpdateWithoutFragmentDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    Message?: MessageUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutFragmentDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    Message?: MessageUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type FragmentCreateWithoutMessageInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl: string
    title: string
    files: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
  }

  export type FragmentUncheckedCreateWithoutMessageInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl: string
    title: string
    files: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
  }

  export type FragmentCreateOrConnectWithoutMessageInput = {
    where: FragmentWhereUniqueInput
    create: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
  }

  export type AttachmentCreateWithoutMessageInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AttachmentUncheckedCreateWithoutMessageInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AttachmentCreateOrConnectWithoutMessageInput = {
    where: AttachmentWhereUniqueInput
    create: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput>
  }

  export type AttachmentCreateManyMessageInputEnvelope = {
    data: AttachmentCreateManyMessageInput | AttachmentCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type ProjectCreateWithoutMessageInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    FragmentDraft?: FragmentDraftCreateNestedOneWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutMessageInput = {
    id?: string
    name: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    framework?: $Enums.Framework
    FragmentDraft?: FragmentDraftUncheckedCreateNestedOneWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutMessageInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutMessageInput, ProjectUncheckedCreateWithoutMessageInput>
  }

  export type FragmentUpsertWithoutMessageInput = {
    update: XOR<FragmentUpdateWithoutMessageInput, FragmentUncheckedUpdateWithoutMessageInput>
    create: XOR<FragmentCreateWithoutMessageInput, FragmentUncheckedCreateWithoutMessageInput>
    where?: FragmentWhereInput
  }

  export type FragmentUpdateToOneWithWhereWithoutMessageInput = {
    where?: FragmentWhereInput
    data: XOR<FragmentUpdateWithoutMessageInput, FragmentUncheckedUpdateWithoutMessageInput>
  }

  export type FragmentUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type FragmentUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    files?: JsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
  }

  export type AttachmentUpsertWithWhereUniqueWithoutMessageInput = {
    where: AttachmentWhereUniqueInput
    update: XOR<AttachmentUpdateWithoutMessageInput, AttachmentUncheckedUpdateWithoutMessageInput>
    create: XOR<AttachmentCreateWithoutMessageInput, AttachmentUncheckedCreateWithoutMessageInput>
  }

  export type AttachmentUpdateWithWhereUniqueWithoutMessageInput = {
    where: AttachmentWhereUniqueInput
    data: XOR<AttachmentUpdateWithoutMessageInput, AttachmentUncheckedUpdateWithoutMessageInput>
  }

  export type AttachmentUpdateManyWithWhereWithoutMessageInput = {
    where: AttachmentScalarWhereInput
    data: XOR<AttachmentUpdateManyMutationInput, AttachmentUncheckedUpdateManyWithoutMessageInput>
  }

  export type AttachmentScalarWhereInput = {
    AND?: AttachmentScalarWhereInput | AttachmentScalarWhereInput[]
    OR?: AttachmentScalarWhereInput[]
    NOT?: AttachmentScalarWhereInput | AttachmentScalarWhereInput[]
    id?: StringFilter<"Attachment"> | string
    type?: EnumAttachmentTypeFilter<"Attachment"> | $Enums.AttachmentType
    url?: StringFilter<"Attachment"> | string
    width?: IntNullableFilter<"Attachment"> | number | null
    height?: IntNullableFilter<"Attachment"> | number | null
    size?: IntFilter<"Attachment"> | number
    createdAt?: DateTimeFilter<"Attachment"> | Date | string
    updatedAt?: DateTimeFilter<"Attachment"> | Date | string
    messageId?: StringFilter<"Attachment"> | string
  }

  export type ProjectUpsertWithoutMessageInput = {
    update: XOR<ProjectUpdateWithoutMessageInput, ProjectUncheckedUpdateWithoutMessageInput>
    create: XOR<ProjectCreateWithoutMessageInput, ProjectUncheckedCreateWithoutMessageInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutMessageInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutMessageInput, ProjectUncheckedUpdateWithoutMessageInput>
  }

  export type ProjectUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    FragmentDraft?: FragmentDraftUpdateOneWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    FragmentDraft?: FragmentDraftUncheckedUpdateOneWithoutProjectNestedInput
  }

  export type FragmentDraftCreateWithoutProjectInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl?: string | null
    files: JsonNullValueInput | InputJsonValue
    framework?: $Enums.Framework
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FragmentDraftUncheckedCreateWithoutProjectInput = {
    id?: string
    sandboxId?: string | null
    sandboxUrl?: string | null
    files: JsonNullValueInput | InputJsonValue
    framework?: $Enums.Framework
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FragmentDraftCreateOrConnectWithoutProjectInput = {
    where: FragmentDraftWhereUniqueInput
    create: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
  }

  export type MessageCreateWithoutProjectInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    Fragment?: FragmentCreateNestedOneWithoutMessageInput
    Attachment?: AttachmentCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutProjectInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    Fragment?: FragmentUncheckedCreateNestedOneWithoutMessageInput
    Attachment?: AttachmentUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutProjectInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput>
  }

  export type MessageCreateManyProjectInputEnvelope = {
    data: MessageCreateManyProjectInput | MessageCreateManyProjectInput[]
    skipDuplicates?: boolean
  }

  export type FragmentDraftUpsertWithoutProjectInput = {
    update: XOR<FragmentDraftUpdateWithoutProjectInput, FragmentDraftUncheckedUpdateWithoutProjectInput>
    create: XOR<FragmentDraftCreateWithoutProjectInput, FragmentDraftUncheckedCreateWithoutProjectInput>
    where?: FragmentDraftWhereInput
  }

  export type FragmentDraftUpdateToOneWithWhereWithoutProjectInput = {
    where?: FragmentDraftWhereInput
    data: XOR<FragmentDraftUpdateWithoutProjectInput, FragmentDraftUncheckedUpdateWithoutProjectInput>
  }

  export type FragmentDraftUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FragmentDraftUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    sandboxId?: NullableStringFieldUpdateOperationsInput | string | null
    sandboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    files?: JsonNullValueInput | InputJsonValue
    framework?: EnumFrameworkFieldUpdateOperationsInput | $Enums.Framework
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUpsertWithWhereUniqueWithoutProjectInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutProjectInput, MessageUncheckedUpdateWithoutProjectInput>
    create: XOR<MessageCreateWithoutProjectInput, MessageUncheckedCreateWithoutProjectInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutProjectInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutProjectInput, MessageUncheckedUpdateWithoutProjectInput>
  }

  export type MessageUpdateManyWithWhereWithoutProjectInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutProjectInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    role?: EnumMessageRoleFilter<"Message"> | $Enums.MessageRole
    type?: EnumMessageTypeFilter<"Message"> | $Enums.MessageType
    status?: EnumMessageStatusFilter<"Message"> | $Enums.MessageStatus
    createdAt?: DateTimeFilter<"Message"> | Date | string
    updatedAt?: DateTimeFilter<"Message"> | Date | string
    projectId?: StringFilter<"Message"> | string
  }

  export type MessageCreateWithoutAttachmentInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    Fragment?: FragmentCreateNestedOneWithoutMessageInput
    Project: ProjectCreateNestedOneWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutAttachmentInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    projectId: string
    Fragment?: FragmentUncheckedCreateNestedOneWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutAttachmentInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutAttachmentInput, MessageUncheckedCreateWithoutAttachmentInput>
  }

  export type MessageUpsertWithoutAttachmentInput = {
    update: XOR<MessageUpdateWithoutAttachmentInput, MessageUncheckedUpdateWithoutAttachmentInput>
    create: XOR<MessageCreateWithoutAttachmentInput, MessageUncheckedCreateWithoutAttachmentInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutAttachmentInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutAttachmentInput, MessageUncheckedUpdateWithoutAttachmentInput>
  }

  export type MessageUpdateWithoutAttachmentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Fragment?: FragmentUpdateOneWithoutMessageNestedInput
    Project?: ProjectUpdateOneRequiredWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutAttachmentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    projectId?: StringFieldUpdateOperationsInput | string
    Fragment?: FragmentUncheckedUpdateOneWithoutMessageNestedInput
  }

  export type AttachmentCreateManyMessageInput = {
    id?: string
    type: $Enums.AttachmentType
    url: string
    width?: number | null
    height?: number | null
    size: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AttachmentUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentUncheckedUpdateManyWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAttachmentTypeFieldUpdateOperationsInput | $Enums.AttachmentType
    url?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    size?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyProjectInput = {
    id?: string
    content: string
    role: $Enums.MessageRole
    type: $Enums.MessageType
    status?: $Enums.MessageStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MessageUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Fragment?: FragmentUpdateOneWithoutMessageNestedInput
    Attachment?: AttachmentUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Fragment?: FragmentUncheckedUpdateOneWithoutMessageNestedInput
    Attachment?: AttachmentUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: EnumMessageRoleFieldUpdateOperationsInput | $Enums.MessageRole
    type?: EnumMessageTypeFieldUpdateOperationsInput | $Enums.MessageType
    status?: EnumMessageStatusFieldUpdateOperationsInput | $Enums.MessageStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}