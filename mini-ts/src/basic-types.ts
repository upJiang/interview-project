// 基本类型示例

// 布尔值
let isDone: boolean = false;

// 数字
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

// 字符串
let color: string = "blue";
let fullName: string = `Bob Bobbington`;
let sentence: string = `Hello, my name is ${fullName}.`;

// 数组
let list1: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3]; // 泛型数组类型

// 元组 Tuple
let x: [string, number];
x = ["hello", 10]; // OK
// x = [10, "hello"]; // Error

// 枚举
enum Color {Red, Green, Blue}
let c: Color = Color.Green;

// 任意值
let notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // 也可以是布尔值

// 空值
function warnUser(): void {
  console.log("This is my warning message");
}

// Null 和 Undefined
let u: undefined = undefined;
let n: null = null;

// Never
function error(message: string): never {
  throw new Error(message);
}

// Object
let obj: object = {};

// 类型断言
let someValue: any = "this is a string";
let strLength1: number = (<string>someValue).length;
let strLength2: number = (someValue as string).length; // 在JSX中只能使用这种as语法 