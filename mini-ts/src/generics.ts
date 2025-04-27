// TypeScript 泛型示例

// 没有泛型的函数
function identity1(arg: any): any {
  return arg;
}

// 使用泛型的函数
function identity2<T>(arg: T): T {
  return arg;
}

// 调用泛型函数
// 方法1：显式地指定类型参数
let output1 = identity2<string>("myString");

// 方法2：使用类型推断（编译器会根据传入的参数自动确定T的类型）
let output2 = identity2("myString"); // 类型参数推断为string

// 泛型接口
interface GenericIdentityFn<T> {
  (arg: T): T;
}

let myIdentity: GenericIdentityFn<number> = identity2;

// 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;

  constructor(zeroValue: T, addFn: (x: T, y: T) => T) {
    this.zeroValue = zeroValue;
    this.add = addFn;
  }
}

// 使用泛型类 - number版本
let myGenericNumber = new GenericNumber<number>(0, (x, y) => x + y);
console.log(myGenericNumber.add(3, 7));  // 10

// 使用泛型类 - string版本
let stringNumeric = new GenericNumber<string>("", (x, y) => x + y);
console.log(stringNumeric.add("Hello ", "World"));  // "Hello World"

// 泛型约束
interface Lengthwise {
  length: number;
}

// 使用extends关键字添加约束，确保传入的参数有length属性
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);  // 现在可以确保arg有length属性
  return arg;
}

// 调用loggingIdentity函数
loggingIdentity({ length: 10, value: 3 });  // OK
// loggingIdentity(3);  // Error, number没有length属性

// 在泛型约束中使用类型参数
// keyof操作符获取类型的所有属性名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

let x = { a: 1, b: 2, c: 3, d: 4 };

getProperty(x, "a"); // OK
// getProperty(x, "m"); // Error: "m"不是"a" | "b" | "c" | "d"

// 使用泛型创建工厂函数
class BeeKeeper {
  hasMask: boolean = true;
}

class ZooKeeper {
  nametag: string = "Mikle";
}

class Animal {
  numLegs: number = 4;
}

class Bee extends Animal {
  keeper: BeeKeeper = new BeeKeeper();
}

class Lion extends Animal {
  keeper: ZooKeeper = new ZooKeeper();
}

// 工厂函数，使用构造函数类型和泛型约束
function createInstance<A extends Animal>(c: new () => A): A {
  return new c();
}

let lion = createInstance(Lion);  // Lion类型
let bee = createInstance(Bee);    // Bee类型

// 条件类型与泛型的结合
type IsArray<T> = T extends Array<any> ? true : false;

// 使用条件类型
type WithArray = IsArray<string[]>;  // true
type WithoutArray = IsArray<number>; // false

// 泛型与映射类型结合
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type PartialTodo = MyPartial<Todo>;
// 等同于
// type PartialTodo = {
//   title?: string;
//   description?: string;
//   completed?: boolean;
// }

// 使用Pick选择特定属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type TodoPreview = MyPick<Todo, "title" | "completed">;
// 等同于
// type TodoPreview = {
//   title: string;
//   completed: boolean;
// }

// 使用Record创建具有特定类型属性的对象类型
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

type PageInfo = {
  title: string;
};

type Page = "home" | "about" | "contact";

const nav: MyRecord<Page, PageInfo> = {
  home: { title: "Home" },
  about: { title: "About" },
  contact: { title: "Contact" }
};

// 使用Omit排除特定属性
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;

type TodoInfo = MyOmit<Todo, "completed">;
// 等同于
// type TodoInfo = {
//   title: string;
//   description: string;
// }

// 在实际开发中的常见泛型使用场景
// 1. API响应类型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: number;
}

// 用户数据类型
interface User {
  id: number;
  name: string;
  email: string;
}

// 特定API响应类型
type UserResponse = ApiResponse<User>;
type UsersResponse = ApiResponse<User[]>; 