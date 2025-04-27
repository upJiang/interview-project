// interface与type的对比

// Interface 接口
interface Person {
  name: string;
  age: number;
}

// Type 类型别名
type PersonType = {
  name: string;
  age: number;
};

// 两者都能描述对象
const person1: Person = { name: "Alice", age: 30 };
const person2: PersonType = { name: "Bob", age: 25 };

// 接口可以被扩展（继承）
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// 类型别名也可以通过交叉类型实现扩展
type AnimalType = {
  name: string;
};

type DogType = AnimalType & {
  breed: string;
};

// 接口可以被多次声明并自动合并
interface Employee {
  name: string;
}

interface Employee {
  id: number;
}

const employee: Employee = {
  name: "Charlie",
  id: 123
}; // 必须同时包含name和id

// 类型别名不能重复声明
// 以下代码会报错
// type User = { name: string; };
// type User = { id: number; }; // Error: Duplicate identifier 'User'

// 接口只能描述对象类型（包括函数和类）
interface GreetFunction {
  (name: string): string;
}

// 类型别名可以描述任何类型，包括基本类型、联合类型、元组等
type ID = string | number;
type Point = [number, number];
type TextValue = string; // 修改名称避免重复

// 实现一个接口
class Developer implements Person {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// 也可以实现一个类型别名（当其形状是对象时）
class Designer implements PersonType {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// 接口可以描述索引类型
interface StringArray {
  [index: number]: string;
}

// 类型别名也可以描述索引类型
type StringArrayType = {
  [index: number]: string;
};

// 总结对比：
// 
// 相同点：
// 1. 都可以描述对象的形状
// 2. 都允许扩展（接口使用extends，类型别名使用&）
// 3. 都可以被类实现（implements）
// 
// 不同点：
// 1. 接口可以被合并声明，类型别名不能
// 2. 类型别名可以为任何类型创建名称，接口只能描述对象形状
// 3. 接口更适合于定义公共API，因为它们的错误信息更友好
// 4. 类型别名更适合于联合类型、交叉类型等复杂类型
// 5. 在扩展时，接口使用extends更清晰，类型别名使用&
// 
// 选择建议：
// - 首选接口，当它能够满足需求时
// - 当需要描述非对象类型或使用联合类型、交叉类型等高级功能时，使用类型别名 