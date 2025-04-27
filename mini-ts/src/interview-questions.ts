// TypeScript 面试题示例

// 1. 什么是TypeScript？它与JavaScript的主要区别是什么？
/*
TypeScript是JavaScript的超集，添加了类型系统和对ES6+特性的支持。
主要区别：
- TypeScript提供静态类型检查，而JavaScript是动态类型
- TypeScript需要编译成JavaScript才能在浏览器中运行
- TypeScript提供接口、泛型、枚举等额外功能
- TypeScript有更强大的工具支持（代码补全、重构、错误检测等）
*/

// 2. any 和 unknown 类型的区别
/*
两者都可以接受任何类型的值，但有重要区别：
- any可以执行任何操作，绕过类型检查
- unknown需要先进行类型检查或类型断言才能使用
- unknown是类型安全的any，推荐使用
*/

// 示例：
let anyVal: any = 10;
anyVal.foo(); // 编译通过，运行时可能报错

let unknownVal: unknown = 10;
// unknownVal.foo(); // 编译错误
if (typeof unknownVal === 'number') {
  console.log(unknownVal.toFixed(2)); // 类型安全，类型守卫后可以使用
}

// 3. interface 和 type 的区别
/*
区别：
- 接口可以被继承和实现，类型别名只能通过交叉类型实现扩展
- 接口可以被合并声明，类型别名不能
- 类型别名可以为任何类型创建名称，接口只能描述对象形状
- 在错误信息中，接口会显示接口名称，类型别名有时显示别名，有时显示实际类型
*/

// 4. never 和 void 的区别
/*
- void 表示函数没有返回值，或返回undefined
- never 表示函数永远不会正常结束（抛出异常或无限循环）
*/

// 示例：
function logMessage(): void {
  console.log("This is a message");
  // 无返回值，或隐式返回undefined
}

function throwError(): never {
  throw new Error("Something went wrong");
  // 永远不会正常结束
}

function infiniteLoop(): never {
  while (true) {
    // 无限循环，永远不会正常结束
  }
}

// 5. const 和 readonly 的区别
/*
- const是JavaScript特性，限制变量不能被重新赋值
- readonly是TypeScript特性，限制属性不能被修改
- const适用于变量，readonly适用于属性
- const对象的属性值可以修改，readonly的属性值不能修改
*/

// 示例：
const constObj = { name: "John" };
constObj.name = "Jane"; // 可以修改属性

interface Person {
  readonly name: string;
}
const person: Person = { name: "John" };
// person.name = "Jane"; // 错误：不能修改readonly属性

// 6. 枚举的作用及用法
/*
枚举用于定义一组命名常量，增强代码可读性和可维护性。
*/

// 数字枚举（默认从0开始）
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

// 字符串枚举
enum HttpStatus {
  OK = "OK",
  NOT_FOUND = "NOT_FOUND",
  ERROR = "ERROR"
}

// 异构枚举（混合数字和字符串）
enum BooleanLikeHeterogeneousEnum {
  No = 0,
  Yes = "YES",
}

// 7. 函数重载的实现方式
/*
函数重载允许一个函数接受不同参数，并返回不同类型的值。
在TypeScript中，通过先声明函数签名，然后实现函数体。
*/

// 声明重载签名
function add(a: number, b: number): number;
function add(a: string, b: string): string;

// 实现函数体
function add(a: any, b: any): any {
  return a + b;
}

// 使用
console.log(add(1, 2));        // 3
console.log(add("Hello, ", "TypeScript")); // "Hello, TypeScript"

// 8. TypeScript如何处理异步编程？
/*
TypeScript支持所有JavaScript的异步编程方法，同时提供类型支持：
- Promise 类型
- Async/await
- 回调函数类型定义
*/

// Promise示例
const fetchData = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve("Data fetched"), 1000);
  });
};

// Async/await示例
async function getData(): Promise<string> {
  const data = await fetchData();
  return `Processed: ${data}`;
}

// 9. 类型断言与类型转换的区别
/*
- 类型断言只在编译时有效，告诉编译器如何理解类型，不改变运行时行为
- 类型转换在运行时实际改变值的类型
*/

// 类型断言
let someValue: unknown = "this is a string";
let strLength1: number = (someValue as string).length; // 类型断言
let strLength2: number = (<string>someValue).length;   // 另一种断言语法

// 10. 泛型是什么？为什么使用泛型？
/*
泛型允许创建可重用的组件，能够适用于多种类型而非单一类型。
使用泛型的好处：
- 代码复用
- 类型安全
- 减少重复代码
*/

// 泛型函数示例
function identity<T>(arg: T): T {
  return arg;
}

// 11. 如何在TypeScript中实现单例模式？
/*
单例模式确保一个类只有一个实例，并提供一个全局访问点。
*/

class Singleton {
  private static instance: Singleton;
  
  private constructor() {
    // 私有构造函数，防止外部创建实例
  }
  
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
  
  public someMethod(): void {
    console.log("Method called");
  }
}

const instance1 = Singleton.getInstance();
const instance2 = Singleton.getInstance();
console.log(instance1 === instance2); // true，两个变量引用同一个实例

// 12. TypeScript中的装饰器是什么？
/*
装饰器是一种特殊类型的声明，可以被附加到类声明、方法、属性或参数上，
用于修改类的行为或添加元数据。
注意：装饰器是实验性特性，需要在tsconfig.json中启用。
*/

// 类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class GreeterClass {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}

// 13. TypeScript中如何处理模块导入导出？
/*
TypeScript支持ES模块和CommonJS模块系统。
*/

// 导出
export interface UserModel {
  id: number;
  name: string;
}

export function createUser(name: string): UserModel {
  return {
    id: Math.random(),
    name
  };
}

// 导入
// import { UserModel, createUser } from './user';
// 或默认导入
// import DefaultExport from './module';

// 14. TypeScript中的高级类型工具（Utility Types）有哪些？
/*
TypeScript提供了多种实用工具类型，如：
- Partial<T>: 将所有属性变为可选
- Required<T>: 将所有属性变为必选
- Readonly<T>: 将所有属性变为只读
- Pick<T, K>: 从T中选择K属性
- Omit<T, K>: 从T中排除K属性
- ReturnType<T>: 获取函数返回类型
等等
*/

// 15. TypeScript如何处理声明文件？
/*
声明文件（.d.ts）用于为没有类型的JavaScript代码提供类型信息。
可以通过以下方式使用：
- 创建自己的声明文件
- 使用DefinitelyTyped提供的第三方库类型（@types/xxx）
*/

// 示例声明文件内容：
// declare module 'lodash' {
//   export function add(a: number, b: number): number;
//   // 其他函数...
// }

// 16. TypeScript中的索引签名是什么？
/*
索引签名允许动态添加属性，同时保持类型安全。
*/

interface Dictionary {
  [key: string]: number;
}

const scores: Dictionary = {};
scores.math = 90; // OK
scores.science = 95; // OK
// scores.english = "A"; // Error: 'string' is not assignable to 'number'

// 17. TypeScript中如何使用映射类型？
/*
映射类型基于旧类型创建新类型，通过遍历旧类型的属性。
*/

type MakeOptional<T> = {
  [K in keyof T]?: T[K];
};

interface UserInterface {
  id: number;
  name: string;
  email: string;
}

type OptionalUser = MakeOptional<UserInterface>;
// 等同于：
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }

// 18. TypeScript中的条件类型是什么？
/*
条件类型根据条件选择类型，类似于编程中的三元运算符。
*/

type TypeName<T> = 
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

let t1: TypeName<string> = "string";
let t2: TypeName<string[]> = "object";

// 19. 什么是字面量类型？
/*
字面量类型表示一个具体的值，而不是一个原始类型范围。
*/

// 字符串字面量类型
type Direction2 = "North" | "East" | "South" | "West";
let dir: Direction2 = "North"; // OK
// dir = "Northeast"; // Error

// 数字字面量类型
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
let roll: DiceRoll = 6; // OK
// roll = 7; // Error

// 20. 什么是TypeScript中的infer关键字？
/*
infer关键字用于条件类型中，表示待推断的类型变量。
*/

type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

function greeting(): string {
  return "Hello, world";
}

type GreetingReturn = GetReturnType<typeof greeting>; // string 