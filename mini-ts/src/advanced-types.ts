// 高级类型示例

// 交叉类型（Intersection Types）
interface BusinessPartner {
  name: string;
  credit: number;
}

interface Identity {
  id: number;
  email: string;
}

// 交叉类型 - 将多种类型合并为一个类型
type EmployeeType = BusinessPartner & Identity;

let emp: EmployeeType = {
  name: "John",
  credit: 100000,
  id: 1,
  email: "john@example.com"
};

// 联合类型（Union Types）
// 表示一个值可以是几种类型之一
type WindowStates = "open" | "closed" | "minimized";
let windowState: WindowStates = "open"; // OK
// windowState = "invalid"; // Error

// 字符串字面量类型
type Direction = "North" | "East" | "South" | "West";
function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

// 数字字面量类型
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
let diceRoll: DiceRoll = 6; // OK
// diceRoll = 7; // Error

// 类型守卫和类型区分（Type Guards and Differentiating Types）
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function getSmallPet(): Fish | Bird {
  // 返回Fish或Bird
  return {
    fly() {},
    layEggs() {}
  } as Bird;
}

// 使用类型断言
let pet = getSmallPet();
if ((pet as Bird).fly) {
  (pet as Bird).fly();
} else {
  (pet as Fish).swim();
}

// 使用自定义类型保护
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

if (isFish(pet)) {
  pet.swim(); // OK - pet是Fish类型
} else {
  pet.fly(); // OK - pet是Bird类型
}

// 使用typeof类型守卫
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value; // padding是数字
  }
  if (typeof padding === "string") {
    return padding + value; // padding是字符串
  }
  throw new Error(`Expected string or number, got '${padding}'.`);
}

// 可为null的类型
let s = "foo";
// s = null; // Error: 'null' is not assignable to 'string'

// 使用联合类型明确表示可能为null
let sn: string | null = "bar";
sn = null; // OK

// 可选参数和属性
function f(x?: number) {
  // x的类型是number | undefined
  return x === undefined ? 0 : x;
}

// 类型别名
interface PersonForList {
  name: string;
}

type LinkedList<T> = T & { next: LinkedList<T> | null };

let people: LinkedList<PersonForList> = {
  name: "Alice",
  next: {
    name: "Bob",
    next: null
  }
};

// 索引类型
function pluck<T, K extends keyof T>(o: T, propertyNames: K[]): T[K][] {
  return propertyNames.map(n => o[n]);
}

interface Car {
  manufacturer: string;
  model: string;
  year: number;
}

let taxi: Car = {
  manufacturer: "Toyota",
  model: "Camry",
  year: 2014
};

let carProps: (keyof Car)[] = ["manufacturer", "model"];
let values = pluck(taxi, carProps); // ['Toyota', 'Camry']

// 映射类型
interface PersonPartial {
  name?: string;
  age?: number;
}

// 通用的Partial类型 - 在自定义命名空间中定义，避免与内置类型冲突
namespace MyTypes {
  export type Partial<T> = {
    [P in keyof T]?: T[P];
  };

  // 使用映射类型
  export type CarPartial = Partial<Car>;
  // 等价于
  // type CarPartial = {
  //   manufacturer?: string;
  //   model?: string;
  //   year?: number;
  // }

  // Readonly映射类型
  export type Readonly<T> = {
    readonly [P in keyof T]: T[P];
  };

  export type ReadonlyCar = Readonly<Car>;
}

// 使用自定义命名空间中的类型
let partialCar: MyTypes.CarPartial = { manufacturer: "Honda" };
let readonlyCar: MyTypes.ReadonlyCar = {
  manufacturer: "BMW",
  model: "X5",
  year: 2020
};

// 条件类型
type TypeName<T> = 
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

let typeName1: TypeName<string> = "string";
let typeName2: TypeName<number[]> = "object";

// 分布式条件类型
type Diff<T, U> = T extends U ? never : T;
type Filter<T, U> = T extends U ? T : never;

type T1 = Diff<"a" | "b" | "c", "a" | "e">; // "b" | "c"
type T2 = Filter<"a" | "b" | "c", "a" | "e">; // "a"

// infer关键字在条件类型中的应用 - 在自定义命名空间中定义，避免与内置类型冲突
namespace FunctionTypes {
  export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
}

function getId(id: number) {
  return id.toString();
}

type IdReturnType = FunctionTypes.ReturnType<typeof getId>; // string 