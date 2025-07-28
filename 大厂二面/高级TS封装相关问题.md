# 高级TS封装相关问题 - 前端面试指南

## 📋 常见面试题与答案

### Q1: 如何实现高级泛型封装？

**标准答案：**
使用泛型约束、条件类型、映射类型等实现类型安全的封装。

**面试回答技巧：**
```typescript
// 高级泛型封装示例
// 1. 泛型约束
interface HasId {
  id: string | number;
}

interface HasName {
  name: string;
}

// 泛型约束：T必须同时具有id和name属性
function processEntity<T extends HasId & HasName>(entity: T): T {
  console.log(`Processing ${entity.name} with id ${entity.id}`);
  return entity;
}

// 2. 条件类型
type IsString<T> = T extends string ? true : false;
type IsNumber<T> = T extends number ? true : false;

// 条件类型封装
type ConditionalType<T> = T extends string 
  ? { type: 'string'; value: string }
  : T extends number 
  ? { type: 'number'; value: number }
  : { type: 'unknown'; value: T };

// 3. 映射类型
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 4. 高级泛型工具类
class GenericContainer<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  filter<U extends T>(predicate: (item: T) => item is U): U[] {
    return this.items.filter(predicate);
  }

  map<U>(transform: (item: T) => U): U[] {
    return this.items.map(transform);
  }
}

// 使用示例
const container = new GenericContainer<string>();
container.add('hello');
container.add('world');

const numbers = container.map(str => str.length);
```

### Q2: 如何实现类型安全的API封装？

**标准答案：**
使用泛型、联合类型、条件类型等实现类型安全的API调用。

**面试回答技巧：**
```typescript
// 类型安全的API封装
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
}

// API方法类型定义
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 请求配置类型
interface RequestConfig {
  method: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
}

// 高级API客户端
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 泛型方法封装
  async request<T>(
    endpoint: string,
    config: RequestConfig = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    const data = await response.json();
    return {
      data,
      status: response.status,
      message: response.statusText,
    };
  }

  // 类型安全的CRUD操作
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 使用示例
const api = new ApiClient('https://api.example.com');

// 类型安全的API调用
const getUser = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

const createPost = async (post: Omit<Post, 'id'>): Promise<Post> => {
  const response = await api.post<Post>('/posts', post);
  return response.data;
};
```

### Q3: 如何实现高级工具类型？

**标准答案：**
使用条件类型、映射类型、模板字面量类型等创建高级工具类型。

**面试回答技巧：**
```typescript
// 高级工具类型实现

// 1. 深度可选类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 2. 深度只读类型
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 3. 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// 4. 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 5. 提取Promise类型
type Awaited<T> = T extends Promise<infer U> ? U : T;

// 6. 条件类型工具
type If<C extends boolean, T, F> = C extends true ? T : F;

// 7. 联合类型转交叉类型
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// 8. 模板字面量类型
type EventName<T extends string> = `${T}Changed`;
type UserEvents = EventName<'user' | 'profile' | 'settings'>;

// 9. 递归类型
type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// 10. 高级映射类型
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// 使用示例
interface User {
  readonly id: number;
  name: string;
  email?: string;
  profile: {
    age: number;
    avatar?: string;
  };
}

type PartialUser = DeepPartial<User>;
type ReadonlyUser = DeepReadonly<User>;
type MutableUser = Mutable<User>;
type RequiredUserKeys = RequiredKeys<User>; // "id" | "name" | "profile"
type OptionalUserKeys = OptionalKeys<User>; // "email"
```

### Q4: 如何实现类型安全的组件封装？

**标准答案：**
使用泛型、联合类型、条件类型等实现类型安全的React组件。

**面试回答技巧：**
```typescript
// 类型安全的React组件封装

// 1. 通用组件Props类型
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// 2. 泛型列表组件
interface ListProps<T> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
}

function List<T>({ items, renderItem, keyExtractor, ...props }: ListProps<T>) {
  return (
    <div {...props}>
      {items.map((item, index) => (
        <div key={keyExtractor?.(item, index) ?? index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// 3. 条件渲染组件
interface ConditionalRenderProps<T> {
  condition: T;
  render: (value: T) => React.ReactNode;
  fallback?: React.ReactNode;
}

function ConditionalRender<T>({
  condition,
  render,
  fallback = null,
}: ConditionalRenderProps<T>) {
  return condition ? <>{render(condition)}</> : <>{fallback}</>;
}

// 4. 高级表单组件
interface FormFieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

// 字符串输入组件
function StringField({
  value,
  onChange,
  label,
  error,
  required,
}: FormFieldProps<string>) {
  return (
    <div>
      {label && <label>{label}{required && '*'}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// 数字输入组件
function NumberField({
  value,
  onChange,
  label,
  error,
  required,
}: FormFieldProps<number>) {
  return (
    <div>
      {label && <label>{label}{required && '*'}</label>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// 5. 类型安全的Hook封装
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 6. 高级状态管理Hook
interface StateMachine<T, E> {
  state: T;
  dispatch: (event: E) => void;
}

function useStateMachine<T, E>(
  initialState: T,
  reducer: (state: T, event: E) => T
): StateMachine<T, E> {
  const [state, setState] = React.useState<T>(initialState);

  const dispatch = React.useCallback((event: E) => {
    setState(prevState => reducer(prevState, event));
  }, [reducer]);

  return { state, dispatch };
}
```

### Q5: 如何实现类型安全的工具函数封装？

**标准答案：**
使用泛型、条件类型、函数重载等实现类型安全的工具函数。

**面试回答技巧：**
```typescript
// 类型安全的工具函数封装

// 1. 函数重载
function parseValue(value: string): string;
function parseValue(value: number): number;
function parseValue(value: boolean): boolean;
function parseValue(value: string | number | boolean): string | number | boolean {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return Math.round(value);
  }
  return value;
}

// 2. 高级泛型函数
function createValidator<T>(
  schema: Record<keyof T, (value: any) => boolean>
) {
  return function validate(data: any): data is T {
    for (const key in schema) {
      if (!schema[key](data[key])) {
        return false;
      }
    }
    return true;
  };
}

// 3. 条件类型函数
type IsArray<T> = T extends any[] ? true : false;

function processArray<T>(value: T): IsArray<T> extends true ? T : never {
  if (Array.isArray(value)) {
    return value.map(item => item * 2) as any;
  }
  throw new Error('Value is not an array');
}

// 4. 高级映射函数
function mapObject<T, U>(
  obj: T,
  mapper: <K extends keyof T>(value: T[K], key: K) => U
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;
  for (const key in obj) {
    result[key] = mapper(obj[key], key);
  }
  return result;
}

// 5. 类型安全的缓存函数
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 6. 高级组合函数
type ComposeFunction<T> = (value: T) => T;

function compose<T>(...functions: ComposeFunction<T>[]): ComposeFunction<T> {
  return (value: T): T => {
    return functions.reduce((result, fn) => fn(result), value);
  };
}

// 7. 类型安全的异步函数
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// 使用示例
const validator = createValidator({
  name: (value) => typeof value === 'string' && value.length > 0,
  age: (value) => typeof value === 'number' && value >= 0,
  email: (value) => typeof value === 'string' && value.includes('@'),
});

const user = { name: 'John', age: 25, email: 'john@example.com' };
if (validator(user)) {
  // TypeScript知道user是有效的
  console.log(user.name);
}
```

### Q6: 如何实现类型安全的装饰器？

**标准答案：**
使用装饰器模式结合TypeScript的高级类型实现类型安全的装饰器。

**面试回答技巧：**
```typescript
// 类型安全的装饰器实现

// 1. 方法装饰器
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };
  
  return descriptor;
}

// 2. 类装饰器
function singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    private static instance: any;
    
    constructor(...args: any[]) {
      if (constructor.prototype.constructor.instance) {
        return constructor.prototype.constructor.instance;
      }
      super(...args);
      constructor.prototype.constructor.instance = this;
    }
  };
}

// 3. 属性装饰器
function readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false,
    configurable: false,
  });
}

// 4. 参数装饰器
function validate(target: any, propertyKey: string, parameterIndex: number) {
  const existingValidators = Reflect.getMetadata('validators', target, propertyKey) || [];
  existingValidators.push(parameterIndex);
  Reflect.defineMetadata('validators', existingValidators, target, propertyKey);
}

// 5. 高级装饰器工厂
function createDecorator<T extends (...args: any[]) => any>(
  decoratorFn: (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return decoratorFn(target, propertyKey, descriptor);
  };
}

// 6. 类型安全的缓存装饰器
function cache<T extends (...args: any[]) => any>(
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cacheMap = new Map<string, ReturnType<T>>();
    
    descriptor.value = function(...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : JSON.stringify(args);
      
      if (cacheMap.has(key)) {
        return cacheMap.get(key)!;
      }
      
      const result = originalMethod.apply(this, args);
      cacheMap.set(key, result);
      return result;
    };
    
    return descriptor;
  };
}

// 使用示例
@singleton
class Database {
  @log
  async query(sql: string): Promise<any[]> {
    // 模拟数据库查询
    return [{ id: 1, name: 'John' }];
  }
  
  @cache()
  expensiveCalculation(n: number): number {
    // 模拟复杂计算
    return n * n;
  }
}

class UserService {
  @readonly
  readonly apiUrl: string = 'https://api.example.com';
  
  @log
  async getUser(@validate id: number): Promise<any> {
    return { id, name: 'John' };
  }
}
```

### Q7: 如何实现类型安全的错误处理？

**标准答案：**
使用泛型、联合类型、条件类型等实现类型安全的错误处理机制。

**面试回答技巧：**
```typescript
// 类型安全的错误处理

// 1. Result类型
type Result<T, E = Error> = Success<T> | Failure<E>;

interface Success<T> {
  type: 'success';
  data: T;
}

interface Failure<E> {
  type: 'failure';
  error: E;
}

// 2. Result工具函数
function success<T>(data: T): Success<T> {
  return { type: 'success', data };
}

function failure<E>(error: E): Failure<E> {
  return { type: 'failure', error };
}

// 3. 类型安全的异步包装器
async function safeAsync<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await promise;
    return success(data);
  } catch (error) {
    return failure(error as Error);
  }
}

// 4. 高级错误类型
interface ValidationError {
  field: string;
  message: string;
}

interface NetworkError {
  status: number;
  message: string;
}

interface BusinessError {
  code: string;
  message: string;
}

type AppError = ValidationError | NetworkError | BusinessError;

// 5. 类型安全的错误处理器
class ErrorHandler {
  static handle<T>(result: Result<T, AppError>): T {
    if (result.type === 'success') {
      return result.data;
    }
    
    switch (result.error.field) {
      case 'validation':
        throw new Error(`Validation error: ${result.error.message}`);
      case 'network':
        throw new Error(`Network error: ${result.error.message}`);
      case 'business':
        throw new Error(`Business error: ${result.error.message}`);
      default:
        throw new Error('Unknown error');
    }
  }
  
  static isValidationError(error: AppError): error is ValidationError {
    return 'field' in error;
  }
  
  static isNetworkError(error: AppError): error is NetworkError {
    return 'status' in error;
  }
  
  static isBusinessError(error: AppError): error is BusinessError {
    return 'code' in error;
  }
}

// 6. 类型安全的验证器
class Validator<T> {
  private validators: Array<(value: T) => string | null> = [];
  
  addValidator(validator: (value: T) => string | null): this {
    this.validators.push(validator);
    return this;
  }
  
  validate(value: T): Result<T, ValidationError[]> {
    const errors: ValidationError[] = [];
    
    for (const validator of this.validators) {
      const error = validator(value);
      if (error) {
        errors.push({ field: 'unknown', message: error });
      }
    }
    
    return errors.length > 0 ? failure(errors) : success(value);
  }
}

// 使用示例
const userValidator = new Validator<{ name: string; age: number }>()
  .addValidator(user => user.name.length > 0 ? null : 'Name is required')
  .addValidator(user => user.age >= 0 ? null : 'Age must be positive');

const user = { name: '', age: -1 };
const result = userValidator.validate(user);

if (result.type === 'failure') {
  console.log('Validation errors:', result.error);
} else {
  console.log('Valid user:', result.data);
}
```

## 🎯 面试技巧总结

### 回答策略

**1. 类型系统理解**
- 理解TypeScript高级类型系统的核心概念
- 能够分析类型推导和约束

**2. 代码实现**
- 展示清晰的类型安全代码实现
- 说明类型封装的实际价值

**3. 实际应用**
- 结合前端实际场景
- 展示类型安全的重要性

### 加分点

1. **类型思维**：展示对TypeScript类型系统的深入理解
2. **代码质量**：写出类型安全、可维护的代码
3. **实际应用**：结合前端实际场景
4. **性能考虑**：考虑类型检查对性能的影响

### 常见误区

1. **过度类型化**：不要为了类型而类型
2. **忽视性能**：要注意类型检查的性能开销
3. **缺乏实践**：要有实际的应用经验
4. **不结合场景**：要结合具体的业务场景

### 面试准备清单

- [ ] 掌握TypeScript高级类型系统
- [ ] 理解泛型和条件类型的使用
- [ ] 能够手写高级工具类型
- [ ] 准备实际应用案例
- [ ] 了解类型安全的最佳实践

## 💡 总结

高级TS封装在前端开发中主要用于：
1. **类型安全**：确保代码的类型安全性
2. **代码复用**：通过泛型实现代码复用
3. **开发体验**：提供更好的IDE支持和错误提示
4. **维护性**：提高代码的可维护性和可读性

面试时要重点展示：
- 对TypeScript高级类型系统的理解
- 清晰的类型安全代码实现能力
- 实际应用和问题解决能力
- 代码组织和架构设计能力 