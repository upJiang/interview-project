/**
 * 工厂模式 (Factory Pattern)
 *
 * 工厂模式是一种创建型设计模式，它提供了一种创建对象的最佳方式。
 * 在工厂模式中，我们在创建对象时不会对客户端暴露创建逻辑，并且是通过使用一个共同的接口来指向新创建的对象。
 */

/**
 * 1. 简单工厂模式
 * 又称为静态工厂方法模式，它属于类创建型模式。
 * 在简单工厂模式中，可以根据参数的不同返回不同类的实例。
 */

// 产品类
class Product {
  constructor(name) {
    this.name = name;
  }

  operation() {
    return `产品 ${this.name} 的基本操作`;
  }
}

class ConcreteProductA extends Product {
  constructor() {
    super("A");
  }

  operation() {
    return `产品 A 的特殊操作`;
  }
}

class ConcreteProductB extends Product {
  constructor() {
    super("B");
  }

  operation() {
    return `产品 B 的特殊操作`;
  }
}

class ConcreteProductC extends Product {
  constructor() {
    super("C");
  }

  operation() {
    return `产品 C 的特殊操作`;
  }
}

// 简单工厂类
class SimpleFactory {
  static createProduct(type) {
    switch (type) {
      case "A":
        return new ConcreteProductA();
      case "B":
        return new ConcreteProductB();
      case "C":
        return new ConcreteProductC();
      default:
        throw new Error(`不支持的产品类型: ${type}`);
    }
  }
}

/**
 * 2. 工厂方法模式
 * 工厂方法模式是一种创建型设计模式，其在父类中提供一个创建对象的方法，允许子类决定实例化对象的类型。
 */

// 抽象产品类
class AbstractProduct {
  constructor() {
    if (new.target === AbstractProduct) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  operation() {
    throw new Error("抽象方法不能被直接调用");
  }
}

class ProductA extends AbstractProduct {
  operation() {
    return "产品A的操作";
  }
}

class ProductB extends AbstractProduct {
  operation() {
    return "产品B的操作";
  }
}

// 抽象工厂类
class AbstractFactory {
  constructor() {
    if (new.target === AbstractFactory) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  createProduct() {
    throw new Error("抽象方法不能被直接调用");
  }
}

class FactoryA extends AbstractFactory {
  createProduct() {
    return new ProductA();
  }
}

class FactoryB extends AbstractFactory {
  createProduct() {
    return new ProductB();
  }
}

/**
 * 3. 抽象工厂模式
 * 抽象工厂模式是一种创建型设计模式，它能创建一系列相关的对象，而无需指定其具体类。
 */

// 抽象产品族类
class AbstractProductX {
  constructor() {
    if (new.target === AbstractProductX) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  operation() {
    throw new Error("抽象方法不能被直接调用");
  }
}

class AbstractProductY {
  constructor() {
    if (new.target === AbstractProductY) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  operation() {
    throw new Error("抽象方法不能被直接调用");
  }
}

// 具体产品类 - 产品族A
class ConcreteProductX1 extends AbstractProductX {
  operation() {
    return "产品X1的操作";
  }
}

class ConcreteProductY1 extends AbstractProductY {
  operation() {
    return "产品Y1的操作";
  }
}

// 具体产品类 - 产品族B
class ConcreteProductX2 extends AbstractProductX {
  operation() {
    return "产品X2的操作";
  }
}

class ConcreteProductY2 extends AbstractProductY {
  operation() {
    return "产品Y2的操作";
  }
}

// 抽象工厂接口
class AbstractFactoryInterface {
  constructor() {
    if (new.target === AbstractFactoryInterface) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  createProductX() {
    throw new Error("抽象方法不能被直接调用");
  }

  createProductY() {
    throw new Error("抽象方法不能被直接调用");
  }
}

// 具体工厂1 - 创建产品族A
class ConcreteFactory1 extends AbstractFactoryInterface {
  createProductX() {
    return new ConcreteProductX1();
  }

  createProductY() {
    return new ConcreteProductY1();
  }
}

// 具体工厂2 - 创建产品族B
class ConcreteFactory2 extends AbstractFactoryInterface {
  createProductX() {
    return new ConcreteProductX2();
  }

  createProductY() {
    return new ConcreteProductY2();
  }
}

/**
 * 4. 实际应用场景示例 - UI组件工厂
 */

// UI组件接口
class Button {
  constructor() {
    if (new.target === Button) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  render() {
    throw new Error("抽象方法不能被直接调用");
  }

  onClick() {
    throw new Error("抽象方法不能被直接调用");
  }
}

class Input {
  constructor() {
    if (new.target === Input) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  render() {
    throw new Error("抽象方法不能被直接调用");
  }

  onFocus() {
    throw new Error("抽象方法不能被直接调用");
  }
}

// 具体产品 - Material Design风格组件
class MaterialButton extends Button {
  render() {
    return '<button class="material-button">点击</button>';
  }

  onClick() {
    return "触发Material按钮点击事件";
  }
}

class MaterialInput extends Input {
  render() {
    return '<input class="material-input" />';
  }

  onFocus() {
    return "触发Material输入框聚焦事件";
  }
}

// 具体产品 - iOS风格组件
class IOSButton extends Button {
  render() {
    return '<button class="ios-button">点击</button>';
  }

  onClick() {
    return "触发iOS按钮点击事件";
  }
}

class IOSInput extends Input {
  render() {
    return '<input class="ios-input" />';
  }

  onFocus() {
    return "触发iOS输入框聚焦事件";
  }
}

// UI工厂接口
class UIFactory {
  constructor() {
    if (new.target === UIFactory) {
      throw new Error("抽象类不能被直接实例化");
    }
  }

  createButton() {
    throw new Error("抽象方法不能被直接调用");
  }

  createInput() {
    throw new Error("抽象方法不能被直接调用");
  }
}

// 具体工厂 - Material Design风格
class MaterialUIFactory extends UIFactory {
  createButton() {
    return new MaterialButton();
  }

  createInput() {
    return new MaterialInput();
  }
}

// 具体工厂 - iOS风格
class IOSUIFactory extends UIFactory {
  createButton() {
    return new IOSButton();
  }

  createInput() {
    return new IOSInput();
  }
}

/**
 * 测试简单工厂模式
 */
function testSimpleFactory() {
  console.log("=== 测试简单工厂模式 ===");

  const productA = SimpleFactory.createProduct("A");
  console.log(productA.operation());

  const productB = SimpleFactory.createProduct("B");
  console.log(productB.operation());

  const productC = SimpleFactory.createProduct("C");
  console.log(productC.operation());

  try {
    SimpleFactory.createProduct("D");
  } catch (error) {
    console.log(`错误: ${error.message}`);
  }
}

/**
 * 测试工厂方法模式
 */
function testFactoryMethod() {
  console.log("\n=== 测试工厂方法模式 ===");

  const factoryA = new FactoryA();
  const productA = factoryA.createProduct();
  console.log(productA.operation());

  const factoryB = new FactoryB();
  const productB = factoryB.createProduct();
  console.log(productB.operation());
}

/**
 * 测试抽象工厂模式
 */
function testAbstractFactory() {
  console.log("\n=== 测试抽象工厂模式 ===");

  // 使用工厂1创建产品族A
  const factory1 = new ConcreteFactory1();
  const productX1 = factory1.createProductX();
  const productY1 = factory1.createProductY();

  console.log(productX1.operation());
  console.log(productY1.operation());

  // 使用工厂2创建产品族B
  const factory2 = new ConcreteFactory2();
  const productX2 = factory2.createProductX();
  const productY2 = factory2.createProductY();

  console.log(productX2.operation());
  console.log(productY2.operation());
}

/**
 * 测试UI组件工厂应用场景
 */
function testUIFactoryApplication() {
  console.log("\n=== 测试UI组件工厂应用场景 ===");

  // 基于系统平台选择合适的UI工厂
  function createUIByPlatform(platform) {
    switch (platform) {
      case "android":
        return new MaterialUIFactory();
      case "ios":
        return new IOSUIFactory();
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  }

  // 用户在Android设备上
  const androidUI = createUIByPlatform("android");
  const materialButton = androidUI.createButton();
  const materialInput = androidUI.createInput();

  console.log("Android UI:");
  console.log(materialButton.render());
  console.log(materialButton.onClick());
  console.log(materialInput.render());
  console.log(materialInput.onFocus());

  // 用户在iOS设备上
  const iosUI = createUIByPlatform("ios");
  const iosButton = iosUI.createButton();
  const iosInput = iosUI.createInput();

  console.log("\niOS UI:");
  console.log(iosButton.render());
  console.log(iosButton.onClick());
  console.log(iosInput.render());
  console.log(iosInput.onFocus());
}

/**
 * 工厂模式在实际项目中的应用 - 表单验证器
 */
function factoryApplications() {
  console.log("\n=== 工厂模式实际应用 ===");

  // 验证器接口
  class Validator {
    constructor() {
      if (new.target === Validator) {
        throw new Error("抽象类不能被直接实例化");
      }
    }

    validate(value) {
      throw new Error("抽象方法不能被直接调用");
    }
  }

  // 具体验证器实现
  class RequiredValidator extends Validator {
    validate(value) {
      return value !== undefined && value !== null && value !== "";
    }
  }

  class EmailValidator extends Validator {
    validate(value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
  }

  class NumberValidator extends Validator {
    validate(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    }
  }

  class MinLengthValidator extends Validator {
    constructor(minLength) {
      super();
      this.minLength = minLength;
    }

    validate(value) {
      return String(value).length >= this.minLength;
    }
  }

  // 验证器工厂
  class ValidatorFactory {
    static createValidator(type, options) {
      switch (type) {
        case "required":
          return new RequiredValidator();
        case "email":
          return new EmailValidator();
        case "number":
          return new NumberValidator();
        case "minLength":
          return new MinLengthValidator(options.length);
        default:
          throw new Error(`不支持的验证器类型: ${type}`);
      }
    }
  }

  // 表单验证示例
  class FormValidator {
    constructor() {
      this.validators = {};
    }

    addValidator(fieldName, validatorType, options = {}) {
      if (!this.validators[fieldName]) {
        this.validators[fieldName] = [];
      }

      const validator = ValidatorFactory.createValidator(
        validatorType,
        options
      );
      this.validators[fieldName].push({ type: validatorType, validator });

      return this; // 链式调用
    }

    validate(formData) {
      const errors = {};

      for (const fieldName in this.validators) {
        const fieldValidators = this.validators[fieldName];
        const value = formData[fieldName];

        for (const { type, validator } of fieldValidators) {
          if (!validator.validate(value)) {
            if (!errors[fieldName]) {
              errors[fieldName] = [];
            }

            let errorMessage = "";
            switch (type) {
              case "required":
                errorMessage = `${fieldName} 是必填项`;
                break;
              case "email":
                errorMessage = `${fieldName} 必须是有效的电子邮件地址`;
                break;
              case "number":
                errorMessage = `${fieldName} 必须是有效的数字`;
                break;
              case "minLength":
                const minLength = validator.minLength;
                errorMessage = `${fieldName} 长度必须至少为 ${minLength} 个字符`;
                break;
            }

            errors[fieldName].push(errorMessage);
          }
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    }
  }

  // 使用表单验证器
  console.log("--- 表单验证器示例 ---");

  const registerForm = new FormValidator();

  // 配置验证规则
  registerForm
    .addValidator("username", "required")
    .addValidator("username", "minLength", { length: 3 })
    .addValidator("email", "required")
    .addValidator("email", "email")
    .addValidator("age", "number");

  // 验证有效表单数据
  const validFormData = {
    username: "john_doe",
    email: "john@example.com",
    age: 25,
  };

  const validResult = registerForm.validate(validFormData);
  console.log("有效表单验证结果:", validResult);

  // 验证无效表单数据
  const invalidFormData = {
    username: "jo",
    email: "invalid-email",
    age: "not-a-number",
  };

  const invalidResult = registerForm.validate(invalidFormData);
  console.log("无效表单验证结果:", invalidResult);
}

/**
 * 工厂模式总结：
 *
 * 1. 核心原则：
 *    - 定义一个创建对象的接口，让子类决定实例化哪一个类
 *    - 使用工厂方法来创建对象，而不是直接使用 new 操作符
 *    - 将对象的创建和使用分离
 *
 * 2. 工厂模式类型：
 *    - 简单工厂：提供一个静态方法来创建不同的对象
 *    - 工厂方法：定义一个用于创建对象的接口，让子类决定实例化哪个类
 *    - 抽象工厂：提供一个创建一系列相关或相互依赖对象的接口，而无需指定它们具体的类
 *
 * 3. 优点：
 *    - 隐藏对象创建的复杂性
 *    - 客户端不需要知道具体产品类的类名，只需知道参数
 *    - 在增加新产品时，无需修改客户端代码
 *    - 符合开闭原则和单一职责原则
 *
 * 4. 缺点：
 *    - 增加系统中类的个数，增加系统复杂度
 *    - 抽象工厂模式难以支持新种类产品的变化
 *    - 简单工厂违背了开闭原则（增加新产品需要修改工厂类）
 *
 * 5. 应用场景：
 *    - 不确定对象的具体类，只知道对象的共同接口时
 *    - 需要根据不同条件创建不同实例时
 *    - 需要创建一系列相关对象时
 *    - UI组件库的创建
 *    - 数据访问对象（DAO）的创建
 *    - 跨平台应用程序的组件创建
 *
 * 6. 面试要点：
 *    - 理解三种工厂模式的区别和各自适用场景
 *    - 能够解释工厂模式如何隐藏对象创建的细节
 *    - 能够讨论工厂模式在前端框架中的应用（如 React.createElement）
 *    - 理解工厂模式与其他创建型模式（如单例、构建者模式）的区别
 *    - 掌握如何使用工厂模式实现插件系统或可扩展架构
 */

// 导出模式实现
module.exports = {
  // 简单工厂模式
  SimpleFactory,
  Product,
  ConcreteProductA,
  ConcreteProductB,
  ConcreteProductC,

  // 工厂方法模式
  AbstractFactory,
  FactoryA,
  FactoryB,
  AbstractProduct,
  ProductA,
  ProductB,

  // 抽象工厂模式
  AbstractFactoryInterface,
  ConcreteFactory1,
  ConcreteFactory2,

  // UI组件工厂
  UIFactory,
  MaterialUIFactory,
  IOSUIFactory,
};

// 运行测试
//testSimpleFactory();
//testFactoryMethod();
//testAbstractFactory();
//testUIFactoryApplication();
//factoryApplications();
