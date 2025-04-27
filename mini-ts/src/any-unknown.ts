// any与unknown的区别

// any类型
let valueAny: any;

// any类型可以赋值给任何类型
valueAny = true;
valueAny = 42;
valueAny = "Hello World";
valueAny = [];
valueAny = {};
valueAny = Math.random;
valueAny = null;
valueAny = undefined;
valueAny = new TypeError();

// any类型可以直接进行任何操作，不会进行类型检查
valueAny.foo.bar;  // OK
valueAny();        // OK
new valueAny();    // OK
valueAny[0][1];    // OK

// unknown类型
let valueUnknown: unknown;

// unknown类型也可以赋值为任何类型
valueUnknown = true;
valueUnknown = 42;
valueUnknown = "Hello World";
valueUnknown = [];
valueUnknown = {};
valueUnknown = Math.random;
valueUnknown = null;
valueUnknown = undefined;
valueUnknown = new TypeError();

// 但不能将unknown类型分配给除了any和unknown之外的类型
// let s1: string = valueUnknown; // Error
// let n1: number = valueUnknown; // Error

// 不能直接对unknown类型进行操作，必须先进行类型检查或类型断言
// valueUnknown.foo.bar;  // Error
// valueUnknown();        // Error
// new valueUnknown();    // Error
// valueUnknown[0][1];    // Error

// 使用类型守卫进行检查后可以操作
if (typeof valueUnknown === "string") {
  console.log(valueUnknown.toUpperCase()); // OK - valueUnknown是string类型
}

// 使用类型断言也可以操作
console.log((valueUnknown as string).toUpperCase()); // OK，但风险高

// 总结：
// 1. any和unknown都可以接受任何类型的值
// 2. unknown类型比any类型更安全，因为不允许直接访问unknown类型值的属性或调用其方法
// 3. 在使用unknown类型时，必须先进行类型检查或类型断言，而any不需要
// 4. 推荐使用unknown代替any，以获得更好的类型安全性 