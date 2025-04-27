# Mini-TS

Mini-TS 是一个展示 TypeScript 常用功能和面试准备的小型项目。这个项目旨在帮助开发者快速了解 TypeScript 的核心概念，并准备 TypeScript 相关的技术面试。

## 项目结构

```
mini-ts/
├── src/                  # 源代码目录
│   ├── basic-types.ts    # 基本类型示例
│   ├── any-unknown.ts    # any和unknown类型对比
│   ├── interface-type.ts # interface和type对比
│   ├── advanced-types.ts # 高级类型示例
│   ├── generics.ts       # 泛型示例
│   ├── utility-types.ts  # 实用工具类型示例
│   └── interview-questions.ts # 面试题示例
└── docs/
    └── study.md          # TypeScript学习总结文档
```

## 项目使用指南

### 环境准备
1. 确保已安装Node.js和npm
2. 全局安装TypeScript: `npm install -g typescript`
3. 克隆此项目到本地: `git clone <项目地址>`

### 运行和学习方法
1. **交互式学习**：使用TypeScript Playground
   - 将示例代码复制到[TypeScript Playground](https://www.typescriptlang.org/play)
   - 实时查看类型检查和编译结果

2. **本地编译运行**：
   ```bash
   # 编译单个文件
   tsc src/basic-types.ts
   
   # 编译并查看结果
   tsc src/basic-types.ts && node src/basic-types.js
   ```

3. **使用VS Code进行学习**：
   - 安装VS Code和TypeScript插件
   - 打开项目文件夹，VS Code会提供实时类型提示
   - 使用代码悬停功能查看详细类型信息

4. **学习路径推荐**：
   1. 从`basic-types.ts`开始，理解基础类型系统
   2. 学习`any-unknown.ts`理解TypeScript的安全性机制
   3. 通过`interface-type.ts`掌握类型定义方法
   4. 深入`advanced-types.ts`了解更复杂的类型操作
   5. 学习`generics.ts`中的泛型概念
   6. 探索`utility-types.ts`中的实用工具类型
   7. 最后通过`interview-questions.ts`进行面试准备

## 针对面试的实用总结

### 常见面试考点分析及答题思路

#### 1. 类型系统相关问题
- **问题**: "TypeScript中的`any`和`unknown`有什么区别？"
- **答题思路**: 
  - 先简述两者的共同点：都可以接受任何类型的值
  - 然后对比关键区别：`any`绕过类型检查，`unknown`需要类型断言或守卫
  - 最后给出实际应用场景和最佳实践：推荐使用`unknown`而非`any`
  - 补充一个简短代码示例来说明区别

#### 2. 类型定义方法问题
- **问题**: "interface和type的区别，如何选择？"
- **答题思路**:
  - 列举相同点：描述对象结构、可扩展、可实现
  - 对比关键差异：声明合并、类型表达能力、错误信息友好度
  - 给出实际选择标准：公共API优先使用interface，复杂类型用type
  - 用简短代码举例说明，如声明合并特性

#### 3. 高级类型应用问题
- **问题**: "如何使用条件类型实现TypeScript中的类型转换？"
- **答题思路**:
  - 简述条件类型的语法和作用：`T extends U ? X : Y`
  - 解释如何使用infer关键字推断类型
  - 提供一个实用示例，如实现ReturnType或提取函数参数类型
  - 说明条件类型在工具类型中的应用

#### 4. 架构设计类问题
- **问题**: "如何在大型项目中组织TypeScript类型？"
- **答题思路**:
  - 提出类型定义的模块化策略：按领域/功能分类
  - 说明如何处理跨模块共享类型：barrel files、类型索引
  - 解释如何使用命名规范：接口前缀、类型别名后缀等
  - 讨论类型文件组织：与实现文件同位或单独类型目录

#### 5. 性能和最佳实践问题
- **问题**: "如何优化TypeScript项目的类型检查性能？"
- **答题思路**:
  - 指出常见性能问题：复杂联合类型、过度使用条件类型
  - 提供解决策略：使用接口代替深层嵌套类型、避免过度泛型
  - 解释配置优化：增量编译、项目引用
  - 提及类型声明文件的优化：精确导出类型

### 面试中常见的编码挑战

1. **实现工具类型**
   - 任务：不使用内置类型，手动实现`Partial<T>`或`Pick<T, K>`
   - 关键点：理解映射类型和索引访问类型
   ```typescript
   // 自己实现Partial
   type MyPartial<T> = {
     [P in keyof T]?: T[P];
   };
   ```

2. **类型推断问题**
   - 任务：使用条件类型推断函数返回类型或参数类型
   - 关键点：infer关键字的使用
   ```typescript
   // 推断返回类型
   type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;
   ```

3. **高级类型转换**
   - 任务：实现联合类型转交叉类型
   - 关键点：理解分布式条件类型
   ```typescript
   // 联合转交叉
   type UnionToIntersection<U> = 
     (U extends any ? (k: U) => void : never) extends (k: infer I) => void 
       ? I 
       : never;
   ```

4. **类型安全API设计**
   - 任务：设计一个类型安全的事件系统或状态管理
   - 关键点：运用泛型和条件类型确保类型安全
   ```typescript
   // 类型安全的事件系统
   type Events = {
     click: { x: number, y: number };
     change: { oldValue: string, newValue: string };
   };
   
   function emit<E extends keyof Events>(event: E, data: Events[E]) {
     // 实现...
   }
   ```

### 面试准备技巧

1. **基础概念准备**
   - 掌握TypeScript类型系统的核心概念
   - 了解TypeScript与JavaScript的区别
   - 能够解释类型推断、类型兼容性规则

2. **实践经验准备**
   - 总结实际项目中使用TypeScript的经验
   - 准备解决过的类型问题案例
   - 能解释如何通过TypeScript提高代码质量

3. **深度问题准备**
   - 研究TypeScript内部实现原理
   - 了解TypeScript编译器如何进行类型检查
   - 熟悉TSConfig配置和影响

4. **编码演示准备**
   - 准备几个能展示TypeScript技能的代码片段
   - 练习实现常见工具类型
   - 能够即时解决类型推断问题

5. **项目体验分享**
   - 准备讲述在大型项目中使用TypeScript的经验
   - 能够分享TypeScript带来的好处和挑战
   - 总结TypeScript最佳实践和团队协作方式

## 项目内容

本项目涵盖以下 TypeScript 内容：

1. **基本类型**：布尔值、数字、字符串、数组、元组、枚举、any、void等
2. **any与unknown的区别**：展示两种类型的异同点和最佳实践
3. **interface与type的对比**：了解两种定义类型方式的区别
4. **高级类型**：交叉类型、联合类型、类型守卫、条件类型等
5. **泛型**：泛型函数、泛型接口、泛型类、泛型约束等
6. **实用工具类型**：Partial、Required、Readonly、Record等
7. **面试题**：收集常见的TypeScript面试题及解答

## TypeScript使用方法总结

### 基本类型
- **布尔值(boolean)**: `let isDone: boolean = false;`
- **数字(number)**: `let decimal: number = 6;`，支持十进制、十六进制、二进制和八进制
- **字符串(string)**: `let color: string = "blue";`，支持模板字符串
- **数组**: `let list1: number[] = [1, 2, 3];` 或 `let list2: Array<number> = [1, 2, 3];`
- **元组(Tuple)**: `let x: [string, number] = ["hello", 10];`
- **枚举(enum)**: `enum Color {Red, Green, Blue}`
- **any**: `let notSure: any = 4;`
- **unknown**: `let valueUnknown: unknown = 10;`
- **void**: `function warnUser(): void { console.log("Warning"); }`
- **null和undefined**: `let u: undefined = undefined;` `let n: null = null;`
- **never**: `function error(message: string): never { throw new Error(message); }`
- **object**: `let obj: object = {};`

### any与unknown的区别
- **any**可以执行任何操作，绕过类型检查
- **unknown**需要先进行类型检查或类型断言才能使用
- **unknown**比**any**更安全，在需要存储任意类型值时推荐使用

### interface与type的对比
- **相同点**：都可以描述对象的形状、都允许扩展、都可以被类实现
- **不同点**：
  - interface可以被合并声明，type不能
  - type可以为任何类型创建名称，包括基本类型、联合类型等
  - interface只能描述对象形状
  - 扩展语法：interface使用extends，type使用交叉类型(&)

### 高级类型
- **交叉类型(Intersection Types)**: `type EmployeeType = BusinessPartner & Identity;`
  ```typescript
  interface Person {
    name: string;
    age: number;
  }
  
  interface Employee {
    companyId: number;
    role: string;
  }
  
  // 交叉类型 - 同时具有Person和Employee的所有属性
  type EmployeePerson = Person & Employee;
  
  const emp: EmployeePerson = {
    name: "张三",
    age: 30,
    companyId: 123456,
    role: "开发工程师"
  };
  
  // 错误：缺少属性'role'
  // const incomplete: EmployeePerson = {
  //   name: "李四",
  //   age: 25,
  //   companyId: 654321
  // };
  ```

- **联合类型(Union Types)**: `type WindowStates = "open" | "closed" | "minimized";`
  ```typescript
  // 窗口状态只允许三种特定值
  type WindowState = "open" | "closed" | "minimized";
  
  function setWindowState(state: WindowState) {
    console.log(`窗口状态已设置为: ${state}`);
  }
  
  setWindowState("open"); // 正确
  setWindowState("closed"); // 正确
  // setWindowState("maximized"); // 错误：类型 '"maximized"' 不能赋给类型 'WindowState'
  
  // 联合类型也可以是不同类型
  type IDType = string | number;
  
  function processID(id: IDType) {
    if (typeof id === 'string') {
      console.log(`字符串ID: ${id.toUpperCase()}`);
    } else {
      console.log(`数字ID: ${id.toFixed(0)}`);
    }
  }
  
  processID("A-123");
  processID(42);
  ```

- **字面量类型**: `type Direction = "North" | "East" | "South" | "West";`
  ```typescript
  // 字符串字面量类型
  type CardinalDirection = "North" | "East" | "South" | "West";
  
  // 数字字面量类型
  type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
  
  // 布尔字面量类型
  type Toggle = true | false;
  
  function move(direction: CardinalDirection, steps: number) {
    console.log(`向${direction}方向移动${steps}步`);
  }
  
  move("North", 3); // 正确
  // move("Northeast", 2); // 错误：类型 '"Northeast"' 不能赋给类型 'CardinalDirection'
  
  function rollDice(): DiceValue {
    return Math.floor(Math.random() * 6) + 1 as DiceValue;
  }
  
  const result = rollDice();
  console.log(`骰子结果: ${result}`);
  ```

- **类型守卫和类型区分**:
  ```typescript
  // 自定义类型守卫
  interface Bird {
    fly(): void;
    layEggs(): void;
  }
  
  interface Fish {
    swim(): void;
    layEggs(): void;
  }
  
  // 定义自定义类型守卫函数
  function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
  }
  
  function moveAnimal(animal: Fish | Bird) {
    if (isFish(animal)) {
      // 这里TypeScript知道animal是Fish类型
      animal.swim();
    } else {
      // 这里TypeScript知道animal是Bird类型
      animal.fly();
    }
  }
  
  // 使用typeof类型守卫
  function formatValue(value: string | number) {
    if (typeof value === "string") {
      // 这里TypeScript知道value是string类型
      return value.toUpperCase();
    } else {
      // 这里TypeScript知道value是number类型
      return value.toFixed(2);
    }
  }
  
  // 使用instanceof类型守卫
  class Car {
    drive() { console.log("行驶中..."); }
  }
  
  class Bicycle {
    ride() { console.log("骑行中..."); }
  }
  
  function useVehicle(vehicle: Car | Bicycle) {
    if (vehicle instanceof Car) {
      // 这里TypeScript知道vehicle是Car类型
      vehicle.drive();
    } else {
      // 这里TypeScript知道vehicle是Bicycle类型
      vehicle.ride();
    }
  }
  ```

- **索引类型**: `function pluck<T, K extends keyof T>(o: T, propertyNames: K[]): T[K][]`
  ```typescript
  function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }
  
  const person = {
    name: "张三",
    age: 30,
    address: "北京市"
  };
  
  // 类型安全的属性访问
  const name = getProperty(person, "name"); // 类型为string
  const age = getProperty(person, "age"); // 类型为number
  // const invalid = getProperty(person, "job"); // 错误：类型"job"的参数不能赋给类型"name"|"age"|"address"的参数
  
  // 索引类型查询操作符：keyof T
  type PersonKeys = keyof typeof person; // "name" | "age" | "address"
  
  // 索引访问操作符：T[K]
  type AgeType = typeof person["age"]; // number
  
  function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][] {
    return keys.map(key => obj[key]);
  }
  
  const values = pluck(person, ["name", "age"]); // ["张三", 30]
  ```

- **映射类型**: `type Readonly<T> = { readonly [P in keyof T]: T[P]; };`
  ```typescript
  type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
  };
  
  interface Point {
    readonly x: number;
    readonly y: number;
  }
  
  // 移除readonly标记
  type MutablePoint = Mutable<Point>;
  
  const p1: Point = { x: 10, y: 20 };
  // p1.x = 5; // 错误：无法分配到"x"，因为它是只读属性
  
  const p2: MutablePoint = { x: 10, y: 20 };
  p2.x = 5; // 正确，属性是可变的
  
  // 可选性映射修饰符
  type Nullable<T> = {
    [P in keyof T]: T[P] | null;
  };
  
  type PartialRecord<K extends keyof any, T> = {
    [P in K]?: T;
  };
  
  // 使用示例
  type NullablePerson = Nullable<Person>;
  // { name: string | null; age: number | null; }
  ```

- **条件类型**: `type TypeName<T> = T extends string ? "string" : "not string";`
  ```typescript
  // 基础条件类型
  type IsString<T> = T extends string ? true : false;
  
  type A = IsString<string>; // true
  type B = IsString<number>; // false
  
  // 条件类型与联合类型结合（分配条件类型）
  type ToArray<T> = T extends any ? T[] : never;
  
  type C = ToArray<string | number>; // string[] | number[]
  
  // 条件类型用于过滤联合类型
  type Diff<T, U> = T extends U ? never : T;
  type Filter<T, U> = T extends U ? T : never;
  
  type D = Diff<"a" | "b" | "c", "a" | "d">; // "b" | "c"
  type E = Filter<"a" | "b" | "c", "a" | "d">; // "a"
  
  // 实际应用：提取函数类型的返回类型
  type GetReturnType<T extends (...args: any[]) => any> = 
    T extends (...args: any[]) => infer R ? R : any;
  
  function fetchUser() {
    return { id: 1, name: "张三" };
  }
  
  type FetchUserReturnType = GetReturnType<typeof fetchUser>;
  // { id: number; name: string; }
  ```

- **infer关键字**: `type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;`
  ```typescript
  // 使用infer提取函数参数类型
  type FirstParameter<T extends (...args: any[]) => any> = 
    T extends (first: infer P, ...args: any[]) => any ? P : never;
  
  function greet(name: string, age: number) {
    return `Hello, ${name}. You are ${age} years old.`;
  }
  
  type GreetFirstParam = FirstParameter<typeof greet>; // string
  
  // 使用infer从泛型中提取类型
  type Unpacked<T> = 
    T extends Array<infer U> ? U :
    T extends Promise<infer U> ? U :
    T extends Map<any, infer U> ? U :
    T;
  
  type T1 = Unpacked<string[]>; // string
  type T2 = Unpacked<Promise<number>>; // number
  type T3 = Unpacked<Map<string, boolean>>; // boolean
  type T4 = Unpacked<string>; // string
  
  // 高级示例：元组转联合类型
  type TupleToUnion<T> = T extends Array<infer U> ? U : never;
  
  type Tuple = [string, number, boolean];
  type Union = TupleToUnion<Tuple>; // string | number | boolean
  ```

### 泛型
- **泛型函数**: `function identity<T>(arg: T): T { return arg; }`
  ```typescript
  // 没有泛型的函数，只能处理特定类型或使用any
  function identityAny(arg: any): any {
    return arg;
  }
  
  // 带泛型的函数，可以保持类型信息
  function identity<T>(arg: T): T {
    return arg;
  }
  
  // 使用方式1：显式指定类型参数
  const output1 = identity<string>("hello"); // 类型为string
  
  // 使用方式2：利用类型推断
  const output2 = identity(42); // 类型为number
  
  // 泛型函数也可以处理数组
  function loggingIdentity<T>(arg: T[]): T[] {
    console.log(arg.length); // 数组有length属性
    return arg;
  }
  
  const arr = loggingIdentity([1, 2, 3]); // 类型为number[]
  ```

- **泛型接口**: `interface GenericIdentityFn<T> { (arg: T): T; }`
  ```typescript
  // 泛型接口
  interface GenericIdentityFn<T> {
    (arg: T): T;
  }
  
  // 实现泛型接口
  function identity<T>(arg: T): T {
    return arg;
  }
  
  // 创建特定类型的泛型函数
  const myIdentity: GenericIdentityFn<number> = identity;
  
  const result = myIdentity(123); // 类型为number
  // const error = myIdentity("abc"); // 错误：类型"string"的参数不能赋给类型"number"的参数
  
  // 泛型接口定义对象结构
  interface Response<T> {
    data: T;
    status: number;
    message: string;
  }
  
  // 使用泛型接口
  interface User {
    id: number;
    name: string;
  }
  
  const userResponse: Response<User> = {
    data: { id: 1, name: "张三" },
    status: 200,
    message: "成功"
  };
  
  // 错误：类型 '{ username: string; }' 不能赋值给类型 'User'
  // const invalidResponse: Response<User> = {
  //   data: { username: "李四" },
  //   status: 200,
  //   message: "成功"
  // };
  ```

- **泛型类**: `class GenericNumber<T> { zeroValue: T; add: (x: T, y: T) => T; }`
  ```typescript
  // 泛型类
  class DataContainer<T> {
    private data: T;
    
    constructor(value: T) {
      this.data = value;
    }
    
    getValue(): T {
      return this.data;
    }
    
    setValue(value: T): void {
      this.data = value;
    }
  }
  
  // 使用字符串类型实例化
  const stringContainer = new DataContainer<string>("Hello");
  const stringValue = stringContainer.getValue(); // 类型为string
  stringContainer.setValue("World");
  // stringContainer.setValue(123); // 错误：类型"number"的参数不能赋给类型"string"的参数
  
  // 使用数字类型实例化
  const numberContainer = new DataContainer<number>(42);
  const numberValue = numberContainer.getValue(); // 类型为number
  numberContainer.setValue(100);
  
  // 更复杂的泛型类示例
  class KeyValuePair<K, V> {
    constructor(public key: K, public value: V) {}
    
    toString(): string {
      return `${String(this.key)}: ${String(this.value)}`;
    }
  }
  
  const pair1 = new KeyValuePair<string, number>("age", 30);
  const pair2 = new KeyValuePair<number, string>(1, "张三");
  
  console.log(pair1.toString()); // "age: 30"
  console.log(pair2.toString()); // "1: 张三"
  ```

- **泛型约束**: `function loggingIdentity<T extends Lengthwise>(arg: T): T`
  ```typescript
  // 定义一个约束接口
  interface WithLength {
    length: number;
  }
  
  // 使用extends关键字应用约束
  function printLength<T extends WithLength>(arg: T): T {
    console.log(`Length: ${arg.length}`);
    return arg;
  }
  
  // 有效：字符串有length属性
  printLength("Hello"); // Length: 5
  
  // 有效：数组有length属性
  printLength([1, 2, 3]); // Length: 3
  
  // 有效：对象满足约束
  printLength({ length: 10, value: 42 }); // Length: 10
  
  // 错误：数字没有length属性
  // printLength(123);
  
  // 泛型约束组合
  interface Person {
    name: string;
  }
  
  function personToString<T extends Person & WithLength>(person: T): string {
    return `${person.name} (Length: ${person.length})`;
  }
  
  personToString({ name: "张三", length: 3, age: 30 }); // "张三 (Length: 3)"
  ```

- **在泛型约束中使用类型参数**: `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`
  ```typescript
  // keyof运算符获取所有属性名
  function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }
  
  const person = {
    name: "张三",
    age: 30,
    isActive: true
  };
  
  // 有效调用：key是obj的属性之一
  console.log(getProperty(person, "name")); // "张三"
  console.log(getProperty(person, "age")); // 30
  console.log(getProperty(person, "isActive")); // true
  
  // 错误：类型""occupation""的参数不能赋给类型""name" | "age" | "isActive""的参数
  // getProperty(person, "occupation");
  
  // 另一个示例：限制类型参数的关系
  function mapObject<T, U, K extends keyof T>(
    obj: T, 
    key: K, 
    fn: (value: T[K]) => U
  ): { [P in keyof T]: P extends K ? U : T[P] } {
    const result = { ...obj };
    result[key] = fn(obj[key]) as any;
    return result;
  }
  
  const transformedPerson = mapObject(
    person,
    "name",
    (name: string) => name.toUpperCase()
  );
  
  console.log(transformedPerson);
  // { name: "张三", age: 30, isActive: true }
  ```

### 实用工具类型
- **Partial<T>**: 将类型的所有属性设为可选
  ```typescript
  interface User {
    id: number;
    name: string;
    email: string;
  }
  
  // 使用Partial使所有属性变为可选
  function updateUser(user: User, fieldsToUpdate: Partial<User>): User {
    return { ...user, ...fieldsToUpdate };
  }
  
  const user: User = {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com"
  };
  
  // 只需要更新部分属性
  const updatedUser = updateUser(user, { name: "李四" });
  ```

- **Required<T>**: 将类型的所有属性设为必选
  ```typescript
  interface PartialUser {
    id?: number;
    name?: string;
    email?: string;
  }
  
  // 使用Required使所有可选属性变为必选
  type CompleteUser = Required<PartialUser>;
  
  // 错误：缺少必需属性
  // const incomplete: CompleteUser = { id: 1 }; 
  
  // 正确：包含所有属性
  const complete: CompleteUser = { 
    id: 1, 
    name: "张三", 
    email: "zhangsan@example.com" 
  };
  ```

- **Readonly<T>**: 将类型的所有属性设为只读
  ```typescript
  interface Config {
    host: string;
    port: number;
    timeout: number;
  }
  
  // 创建只读配置，防止意外修改
  const config: Readonly<Config> = {
    host: "localhost",
    port: 3000,
    timeout: 5000
  };
  
  // 错误：无法分配到 "host"，因为它是只读属性
  // config.host = "127.0.0.1";
  ```

- **Record<K, T>**: 构造属性键为K，属性值为T的对象类型
  ```typescript
  // 创建一个以字符串为键，以用户对象为值的映射
  type UserRecord = Record<string, User>;
  
  const userDirectory: UserRecord = {
    "user1": {
      id: 1,
      name: "张三",
      email: "zhangsan@example.com"
    },
    "user2": {
      id: 2,
      name: "李四",
      email: "lisi@example.com"
    }
  };
  ```

- **Pick<T, K>**: 从T中选取属性K
  ```typescript
  // 仅选择用户的id和name属性
  type UserPreview = Pick<User, "id" | "name">;
  
  const userList: UserPreview[] = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" }
  ];
  
  // 错误：类型 "{ id: number; name: string; role: string; }" 不能赋值给类型 "UserPreview"
  // userList.push({ id: 3, name: "王五", role: "admin" });
  ```

- **Omit<T, K>**: 从T中排除属性K
  ```typescript
  // 创建不包含email的用户类型
  type UserWithoutEmail = Omit<User, "email">;
  
  const userWithoutEmail: UserWithoutEmail = {
    id: 1,
    name: "张三"
    // 不需要email属性
  };
  ```

- **Exclude<T, U>**: 从T中排除可分配给U的类型
  ```typescript
  type AllRoles = "admin" | "editor" | "viewer" | "guest";
  
  // 排除低权限角色
  type HighPrivilegeRoles = Exclude<AllRoles, "viewer" | "guest">;
  // 结果为: "admin" | "editor"
  
  const role: HighPrivilegeRoles = "admin"; // 有效
  // const lowRole: HighPrivilegeRoles = "guest"; // 错误
  ```

- **Extract<T, U>**: 从T中提取可分配给U的类型
  ```typescript
  type AllRoles = "admin" | "editor" | "viewer" | "guest";
  
  // 提取低权限角色
  type LowPrivilegeRoles = Extract<AllRoles, "viewer" | "guest" | "anonymous">;
  // 结果为: "viewer" | "guest"
  
  const lowRole: LowPrivilegeRoles = "guest"; // 有效
  // const highRole: LowPrivilegeRoles = "admin"; // 错误
  ```

- **NonNullable<T>**: 从T中排除null和undefined
  ```typescript
  type NullableString = string | null | undefined;
  
  // 移除null和undefined
  type DefinitelyString = NonNullable<NullableString>;
  // 结果为: string
  
  function processString(s: DefinitelyString) {
    console.log(s.length); // 安全，不需要检查null或undefined
  }
  ```

- **ReturnType<T>**: 获取函数类型T的返回类型
  ```typescript
  function createUser(name: string, age: number) {
    return {
      id: Date.now(),
      name,
      age,
      createdAt: new Date()
    };
  }
  
  // 提取函数返回类型
  type NewUser = ReturnType<typeof createUser>;
  
  const userProcessor = (user: NewUser) => {
    console.log(`处理用户: ${user.name}, 年龄: ${user.age}`);
  };
  
  userProcessor(createUser("张三", 30));
  ```

- **Parameters<T>**: 获取函数类型T的参数类型
  ```typescript
  function buildQuery(userId: number, filters: string[], sortBy?: string) {
    // 查询构建逻辑
    return { userId, filters, sortBy };
  }
  
  // 获取函数参数类型
  type QueryParams = Parameters<typeof buildQuery>;
  // 结果为: [userId: number, filters: string[], sortBy?: string | undefined]
  
  // 使用解构赋值应用参数
  function executeQuery(...args: QueryParams) {
    const query = buildQuery(...args);
    console.log("执行查询:", query);
  }
  
  executeQuery(1, ["active"], "name");
  ```

- **字符串操作类型**: Uppercase<S>、Lowercase<S>、Capitalize<S>、Uncapitalize<S>
  ```typescript
  type HeadersMap = {
    [K in 'content-type' | 'user-agent' | 'accept']: string
  };
  
  // 将所有键转换为首字母大写格式
  type NormalizedHeadersMap = {
    [K in keyof HeadersMap as Capitalize<K>]: HeadersMap[K]
  };
  
  // 结果为: { "Content-type": string, "User-agent": string, "Accept": string }
  
  const headers: NormalizedHeadersMap = {
    "Content-type": "application/json",
    "User-agent": "Mozilla",
    "Accept": "text/html"
  };
  ```

### 装饰器
- **类装饰器**: `@sealed class Person { }`
  ```typescript
  // 类装饰器
  function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
  }
  
  @sealed
  class Person {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
  }
  
  // 带参数的类装饰器
  function classDecorator<T extends { new(...args: any[]): {} }>(
    constructor: T
  ) {
    return class extends constructor {
      newProperty = "新属性";
      hello = "覆盖";
    };
  }
  
  @classDecorator
  class Greeter {
    property = "属性";
    hello: string;
    constructor(m: string) {
      this.hello = m;
    }
  }
  
  console.log(new Greeter("世界").hello); // "覆盖"
  ```

- **方法装饰器**: `@enumerable(false) method() { }`
  ```typescript
  // 方法装饰器
  function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      console.log(`调用方法 ${propertyKey} 参数:`, args);
      const result = originalMethod.apply(this, args);
      console.log(`方法 ${propertyKey} 返回:`, result);
      return result;
    };
    
    return descriptor;
  }
  
  class Calculator {
    @log
    add(a: number, b: number): number {
      return a + b;
    }
  }
  
  const calc = new Calculator();
  calc.add(1, 2);
  // 输出:
  // 调用方法 add 参数: [1, 2]
  // 方法 add 返回: 3
  
  // 可配置方法装饰器
  function validate(validator: (value: any) => boolean) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = function(value: any) {
        if (validator(value)) {
          return originalMethod.call(this, value);
        } else {
          throw new Error("参数验证失败");
        }
      };
      
      return descriptor;
    };
  }
  
  class User {
    @validate(value => typeof value === 'string' && value.length > 0)
    setName(name: string) {
      console.log(`名称设置为: ${name}`);
    }
  }
  
  const user = new User();
  user.setName("张三"); // 输出: "名称设置为: 张三"
  // user.setName(""); // 错误: "参数验证失败"
  ```

- **访问器装饰器**: `@configurable(false) get name() { }`
  ```typescript
  // 访问器装饰器
  function configurable(value: boolean) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      descriptor.configurable = value;
      return descriptor;
    };
  }
  
  class Person {
    private _name: string;
    
    constructor(name: string) {
      this._name = name;
    }
    
    @configurable(false)
    get name(): string {
      return this._name;
    }
    
    @configurable(false)
    set name(value: string) {
      this._name = value;
    }
  }
  
  const person = new Person("张三");
  console.log(person.name); // "张三"
  person.name = "李四";
  console.log(person.name); // "李四"
  
  // Object.defineProperty(Person.prototype, 'name', {
  //   value: "强制覆盖"
  // }); // 错误: 无法重新定义不可配置的属性"name"
  ```

- **属性装饰器**: `@format("YYYY-MM-DD") birthDate: Date;`
  ```typescript
  // 属性装饰器
  function required(target: any, propertyKey: string) {
    let value: any;
    
    const getter = function() {
      return value;
    };
    
    const setter = function(newVal: any) {
      if (newVal === undefined || newVal === null) {
        throw new Error(`属性 ${propertyKey} 不能为空`);
      }
      value = newVal;
    };
    
    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  }
  
  class Product {
    @required
    name: string;
    
    price: number;
    
    constructor(name: string, price: number) {
      this.name = name;
      this.price = price;
    }
  }
  
  const product = new Product("手机", 1999);
  console.log(product.name); // "手机"
  
  // const invalidProduct = new Product("", 999);
  // invalidProduct.name = null; // 错误: 属性 name 不能为空
  
  // 带参数的属性装饰器
  function defaultValue(value: any) {
    return function(target: any, propertyKey: string) {
      target[propertyKey] = value;
    };
  }
  
  class Settings {
    @defaultValue(true)
    isEnabled: boolean;
    
    @defaultValue("默认用户")
    username: string;
  }
  
  const settings = new Settings();
  console.log(settings.isEnabled); // true
  console.log(settings.username); // "默认用户"
  ```

- **参数装饰器**: `function method(@required() parameter) { }`
  ```typescript
  // 参数装饰器
  function logParameter(target: any, methodName: string, paramIndex: number) {
    console.log(`Method: ${methodName}, Parameter Index: ${paramIndex}`);
  }
  
  class TestService {
    testMethod(@logParameter message: string, @logParameter count: number) {
      return `${message} 重复 ${count} 次`;
    }
  }
  
  // 输出:
  // Method: testMethod, Parameter Index: 1
  // Method: testMethod, Parameter Index: 0
  
  // 参数验证装饰器
  type ValidatorFn = (value: any) => boolean;
  
  function validate(validatorFn: ValidatorFn) {
    return function(target: any, methodName: string, paramIndex: number) {
      const original = target[methodName];
      
      target[methodName] = function(...args: any[]) {
        // 验证目标参数
        if (!validatorFn(args[paramIndex])) {
          throw new Error(`参数 ${paramIndex} 在方法 ${methodName} 中验证失败`);
        }
        
        return original.apply(this, args);
      };
    };
  }
  
  class UserService {
    createUser(
      @validate(value => typeof value === 'string' && value.length >= 3)
      username: string,
      
      @validate(value => typeof value === 'string' && /^.+@.+\..+$/.test(value))
      email: string
    ) {
      return { username, email };
    }
  }
  
  const userService = new UserService();
  console.log(userService.createUser("张三", "zhangsan@example.com"));
  // { username: "张三", email: "zhangsan@example.com" }
  
  // userService.createUser("李", "invalid-email"); 
  // 错误: 参数 0 在方法 createUser 中验证失败
  ```

## TypeScript常见面试题总结

1. **什么是TypeScript？它与JavaScript的主要区别是什么？**
   - TypeScript是JavaScript的超集，添加了类型系统和对ES6+特性的支持
   - 主要区别：TypeScript提供静态类型检查，需要编译成JavaScript才能运行，提供更多高级特性，有更强大的工具支持

2. **any和unknown类型的区别**
   - 两者都可以接受任何类型值，但any可以绕过类型检查，而unknown需要先进行类型检查或断言才能使用
   - unknown比any更安全

3. **interface和type的区别**
   - 接口可以被合并声明，类型别名不能
   - 类型别名可以为任何类型创建名称，接口只能描述对象形状
   - 接口更适合定义公共API，类型别名更适合复杂类型

4. **never和void的区别**
   - void表示函数没有返回值或返回undefined
   - never表示函数永远不会正常结束（抛出异常或无限循环）

5. **const和readonly的区别**
   - const是JavaScript特性，限制变量不能被重新赋值
   - readonly是TypeScript特性，限制属性不能被修改
   - const适用于变量，readonly适用于属性
   - const对象的属性值可以修改，readonly的属性值不能修改

6. **枚举的作用及用法**
   - 数字枚举、字符串枚举、异构枚举（混合数字和字符串）
   - 用于定义一组命名常量，增强代码可读性和可维护性

7. **函数重载的实现方式**
   - 先声明函数签名，然后实现函数体

8. **TypeScript如何处理异步编程**
   - 支持Promise类型、Async/await、回调函数类型定义

9. **类型断言与类型转换的区别**
   - 类型断言只在编译时有效，不改变运行时行为
   - 类型转换在运行时实际改变值的类型

10. **泛型是什么？为什么使用泛型？**
    - 泛型允许创建可重用组件，适用于多种类型
    - 使用泛型可以保持类型安全性、提高代码复用性、减少重复代码

11. **如何在TypeScript中实现单例模式**
    - 通过私有构造函数和静态实例方法实现

12. **TypeScript中的装饰器是什么**
    - 装饰器是一种特殊类型的声明，可用于修改类、方法、属性或参数的行为或添加元数据

13. **TypeScript中如何处理模块导入导出**
    - 支持ES模块和CommonJS模块系统

14. **TypeScript中的高级类型工具有哪些**
    - Partial、Required、Readonly、Pick、Omit、ReturnType等

15. **TypeScript如何处理声明文件**
    - 使用.d.ts文件为JavaScript代码提供类型信息

16. **TypeScript中的索引签名是什么**
    - 允许动态添加属性，同时保持类型安全

17. **TypeScript中如何使用映射类型**
    - 基于旧类型创建新类型，通过遍历旧类型的属性

18. **TypeScript中的条件类型是什么**
    - 根据条件选择类型，类似于编程中的三元运算符

19. **什么是字面量类型**
    - 表示一个具体的值，而不是一个原始类型范围

20. **什么是TypeScript中的infer关键字**
    - 用于条件类型中，表示待推断的类型变量

## 学习资源

参考 `docs/study.md` 获取详细的 TypeScript 学习总结，包括：

- TypeScript 基础知识
- 高级特性解析
- 常见面试题及答案
- 最佳实践

## 贡献

欢迎提交 Issue 或 Pull Request 来完善这个项目，添加更多有用的示例或面试题。 