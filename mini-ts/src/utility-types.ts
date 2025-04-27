// TypeScript 实用工具类型示例

// 首先定义一个示例接口，后续会基于这个接口展示各种工具类型
interface TodoItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

// 1. Partial<T> - 将T的所有属性设为可选
type PartialTodoItem = Partial<TodoItem>;

const updateTodo = (todo: TodoItem, fieldsToUpdate: Partial<TodoItem>): TodoItem => {
  return { ...todo, ...fieldsToUpdate };
};

const todo1: TodoItem = {
  id: 1,
  title: "Learn TypeScript",
  description: "Study advanced TypeScript features",
  completed: false,
  createdAt: new Date()
};

// 只需要更新部分属性
const todo2 = updateTodo(todo1, {
  completed: true
});

// 2. Required<T> - 将T的所有属性设为必选
interface PartialPoint {
  x?: number;
  y?: number;
}

// 所有属性都变成必选
type RequiredPoint = Required<PartialPoint>;
// 等价于
// interface RequiredPoint {
//   x: number;
//   y: number;
// }

// 3. Readonly<T> - 将T的所有属性设为只读
type ReadonlyTodoItem = Readonly<TodoItem>;

const todo3: ReadonlyTodoItem = {
  id: 2,
  title: "Read a book",
  description: "Read Effective TypeScript book",
  completed: false,
  createdAt: new Date()
};

// 不能修改只读属性
// todo3.completed = true; // Error: Cannot assign to 'completed' because it is a read-only property.

// 4. Record<K, T> - 构造一个属性键为K，属性值为T的对象类型
type TodoItemRecord = Record<string, TodoItem>;

const todos: TodoItemRecord = {
  "todo1": {
    id: 1,
    title: "Learn TypeScript",
    description: "Study advanced TypeScript features",
    completed: false,
    createdAt: new Date()
  },
  "todo2": {
    id: 2,
    title: "Read a book",
    description: "Read Effective TypeScript book",
    completed: false,
    createdAt: new Date()
  }
};

// 5. Pick<T, K> - 从T中选取属性K
type TodoItemPreview = Pick<TodoItem, "id" | "title" | "completed">;

const todoPreview: TodoItemPreview = {
  id: 1,
  title: "Learn TypeScript",
  completed: false
};

// 6. Omit<T, K> - 从T中排除属性K
type TodoWithoutDescription = Omit<TodoItem, "description">;

const todoWithoutDesc: TodoWithoutDescription = {
  id: 3,
  title: "Buy groceries",
  completed: false,
  createdAt: new Date()
};

// 7. Exclude<T, U> - 从T中排除可分配给U的类型
type ExcludeExample1 = Exclude<"a" | "b" | "c", "a">; // "b" | "c"
type ExcludeExample2 = Exclude<string | number | (() => void), Function>; // string | number

// 8. Extract<T, U> - 从T中提取可分配给U的类型
type ExtractExample1 = Extract<"a" | "b" | "c", "a" | "f">; // "a"
type ExtractExample2 = Extract<string | number | (() => void), Function>; // () => void

// 9. NonNullable<T> - 从T中排除null和undefined
type T4 = NonNullable<string | number | undefined | null>; // string | number

// 10. ReturnType<T> - 获取函数类型T的返回类型
function f1(): { a: number; b: string } {
  return { a: 1, b: "hello" };
}

type T5 = ReturnType<typeof f1>; // { a: number, b: string }
type T6 = ReturnType<() => void>; // void
type T7 = ReturnType<() => string>; // string

// 11. InstanceType<T> - 获取构造函数类型T的实例类型
class C {
  x = 0;
  y = 0;
}

type T8 = InstanceType<typeof C>; // C

// 12. Parameters<T> - 获取函数类型T的参数类型
type T9 = Parameters<(a: number, b: string) => void>; // [number, string]
type T10 = Parameters<typeof Math.max>; // number[]

// 13. ConstructorParameters<T> - 获取构造函数类型T的参数类型
class Person {
  constructor(name: string, age: number) {}
}

type T11 = ConstructorParameters<typeof Person>; // [string, number]

// 14. ThisParameterType<T> - 提取函数类型T的this参数类型
function toHex(this: Number) {
  return this.toString(16);
}

type T12 = ThisParameterType<typeof toHex>; // Number

// 15. OmitThisParameter<T> - 移除函数类型T的this参数类型
type T13 = OmitThisParameter<typeof toHex>; // () => string

// 16. ThisType<T> - 标记上下文this类型
interface ThisTypeDemoObj {
  value: number;
  increment(): void;
}

let obj: ThisTypeDemoObj & ThisType<{ value: number }> = {
  value: 0,
  increment() {
    this.value++;
  }
};

// 17. Uppercase<S> - 将字符串类型转换为大写
type T14 = Uppercase<"hello">; // "HELLO"

// 18. Lowercase<S> - 将字符串类型转换为小写
type T15 = Lowercase<"HELLO">; // "hello"

// 19. Capitalize<S> - 将字符串类型的首字母转换为大写
type T16 = Capitalize<"hello">; // "Hello"

// 20. Uncapitalize<S> - 将字符串类型的首字母转换为小写
type T17 = Uncapitalize<"Hello">; // "hello"

// 21. 自定义工具类型示例

// DeepReadonly - 递归将所有属性设为只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface NestedObject {
  nested: {
    prop: string;
  };
}

type ReadonlyNestedObject = DeepReadonly<NestedObject>;
const ro: ReadonlyNestedObject = {
  nested: {
    prop: "value"
  }
};

// 以下会报错
// ro.nested.prop = "new value"; // Error: Cannot assign to 'prop' because it is a read-only property.

// ValueOf - 获取对象类型的所有值的类型
type ValueOf<T> = T[keyof T];

type Person2 = {
  name: string;
  age: number;
};

type PersonValue = ValueOf<Person2>; // string | number 