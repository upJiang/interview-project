import { useCallback, useMemo, useRef, useState } from "react";

/**
 * useForm 自定义Hook
 *
 * 核心功能：
 * 1. 表单状态管理
 * 2. 表单验证
 * 3. 错误处理
 * 4. 提交处理
 * 5. 字段级别控制
 * 6. 性能优化
 *
 * 面试考察点：
 * 1. 状态管理策略
 * 2. 验证机制设计
 * 3. 性能优化技巧
 * 4. 错误处理模式
 * 5. 自定义Hook设计
 * 6. 表单最佳实践
 */

// 基础 useForm Hook
const useForm = (initialValues = {}, options = {}) => {
  const {
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    onSubmit,
    onError,
    resetOnSubmit = false,
    enableReinitialize = false,
  } = options;

  // 表单状态
  const [values, setFormValues] = useState(initialValues);
  const [errors, setFormErrors] = useState({});
  const [touched, setFormTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // 引用
  const initialValuesRef = useRef(initialValues);
  const validationRulesRef = useRef(validationRules);

  // 更新引用
  if (enableReinitialize && initialValuesRef.current !== initialValues) {
    initialValuesRef.current = initialValues;
    setFormValues(initialValues);
  }

  // 验证单个字段
  const validateField = useCallback(
    async (name, value) => {
      const rules = validationRulesRef.current[name];
      if (!rules) return null;

      try {
        if (typeof rules === "function") {
          return await rules(value, values);
        }

        if (Array.isArray(rules)) {
          for (const rule of rules) {
            const error = await rule(value, values);
            if (error) return error;
          }
        }

        return null;
      } catch (error) {
        return error.message || "验证失败";
      }
    },
    [values]
  );

  // 验证所有字段
  const validateForm = useCallback(
    async (valuesToValidate = values) => {
      setIsValidating(true);
      const newErrors = {};

      try {
        const validationPromises = Object.keys(validationRulesRef.current).map(
          async (name) => {
            const error = await validateField(name, valuesToValidate[name]);
            if (error) {
              newErrors[name] = error;
            }
          }
        );

        await Promise.all(validationPromises);
        setFormErrors(newErrors);

        return Object.keys(newErrors).length === 0;
      } catch (error) {
        console.error("表单验证失败:", error);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [values, validateField]
  );

  // 设置字段值
  const setValue = useCallback(
    (name, value) => {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // 实时验证
      if (validateOnChange && touched[name]) {
        validateField(name, value).then((error) => {
          setFormErrors((prev) => ({
            ...prev,
            [name]: error,
          }));
        });
      }
    },
    [validateOnChange, touched, validateField]
  );

  // 设置多个字段值
  const setValues = useCallback(
    (newValues) => {
      if (typeof newValues === "function") {
        setFormValues((prev) => {
          const updated = newValues(prev);
          if (validateOnChange) {
            validateForm(updated);
          }
          return updated;
        });
      } else {
        setFormValues(newValues);
        if (validateOnChange) {
          validateForm(newValues);
        }
      }
    },
    [validateOnChange, validateForm]
  );

  // 设置字段错误
  const setError = useCallback((name, error) => {
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  // 设置多个字段错误
  const setErrors = useCallback((newErrors) => {
    if (typeof newErrors === "function") {
      setFormErrors((prev) => newErrors(prev));
    } else {
      setFormErrors(newErrors);
    }
  }, []);

  // 设置字段触摸状态
  const setTouched = useCallback((name, isTouched = true) => {
    setFormTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  // 处理字段变化
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === "checkbox" ? checked : value;

      setValue(name, fieldValue);
    },
    [setValue]
  );

  // 处理字段失焦
  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;

      setTouched(name, true);

      if (validateOnBlur) {
        validateField(name, value).then((error) => {
          setFormErrors((prev) => ({
            ...prev,
            [name]: error,
          }));
        });
      }
    },
    [validateOnBlur, validateField]
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
      }

      setSubmitCount((prev) => prev + 1);

      // 标记所有字段为已触摸
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setFormTouched(allTouched);

      if (validateOnSubmit) {
        const isValid = await validateForm();
        if (!isValid) {
          onError?.(errors);
          return;
        }
      }

      setIsSubmitting(true);

      try {
        await onSubmit?.(values);

        if (resetOnSubmit) {
          reset();
        }
      } catch (error) {
        console.error("表单提交失败:", error);
        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      values,
      errors,
      validateOnSubmit,
      validateForm,
      onSubmit,
      onError,
      resetOnSubmit,
    ]
  );

  // 重置表单
  const reset = useCallback((newValues = initialValuesRef.current) => {
    setFormValues(newValues);
    setFormErrors({});
    setFormTouched({});
    setIsSubmitting(false);
    setIsValidating(false);
    setSubmitCount(0);
  }, []);

  // 获取字段属性
  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] || "",
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] && errors[name],
      "aria-invalid": touched[name] && errors[name] ? "true" : "false",
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  // 获取字段元数据
  const getFieldMeta = useCallback(
    (name) => ({
      value: values[name],
      error: errors[name],
      touched: touched[name],
      initialValue: initialValuesRef.current[name],
      valid: !errors[name],
      invalid: !!errors[name],
    }),
    [values, errors, touched]
  );

  // 计算表单状态
  const formState = useMemo(
    () => ({
      isValid: Object.keys(errors).length === 0,
      isInvalid: Object.keys(errors).length > 0,
      isDirty:
        JSON.stringify(values) !== JSON.stringify(initialValuesRef.current),
      isPristine:
        JSON.stringify(values) === JSON.stringify(initialValuesRef.current),
      isSubmitting,
      isValidating,
      submitCount,
      touchedFields: Object.keys(touched).filter((key) => touched[key]),
      errorFields: Object.keys(errors).filter((key) => errors[key]),
    }),
    [values, errors, touched, isSubmitting, isValidating, submitCount]
  );

  return {
    // 状态
    values,
    errors,
    touched,
    ...formState,

    // 方法
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    reset,
    getFieldProps,
    getFieldMeta,
  };
};

// 高级 useForm Hook
const useAdvancedForm = (initialValues = {}, options = {}) => {
  const {
    validationSchema,
    validationMode = "onChange",
    reValidateMode = "onChange",
    submitFocusError = true,
    shouldUnregister = false,
    delayError = 0,
    ...restOptions
  } = options;

  const baseForm = useForm(initialValues, restOptions);

  // 字段注册
  const [registeredFields, setRegisteredFields] = useState(new Set());
  const fieldRefs = useRef({});

  // 注册字段
  const register = useCallback(
    (name, validation = {}) => {
      setRegisteredFields((prev) => new Set([...prev, name]));

      return {
        name,
        ref: (ref) => {
          if (ref) {
            fieldRefs.current[name] = ref;
          }
        },
        onChange: (e) => {
          baseForm.handleChange(e);

          // 延迟验证
          if (delayError > 0) {
            setTimeout(() => {
              baseForm.validateField(name, e.target.value);
            }, delayError);
          }
        },
        onBlur: baseForm.handleBlur,
        "aria-invalid": baseForm.getFieldMeta(name).invalid,
        "aria-describedby": baseForm.getFieldMeta(name).error
          ? `${name}-error`
          : undefined,
      };
    },
    [baseForm, delayError]
  );

  // 注销字段
  const unregister = useCallback(
    (name) => {
      if (shouldUnregister) {
        setRegisteredFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(name);
          return newSet;
        });

        delete fieldRefs.current[name];

        baseForm.setValues((prev) => {
          const newValues = { ...prev };
          delete newValues[name];
          return newValues;
        });

        baseForm.setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [shouldUnregister, baseForm]
  );

  // 聚焦到第一个错误字段
  const focusError = useCallback(() => {
    const firstErrorField = Object.keys(baseForm.errors)[0];
    if (firstErrorField && fieldRefs.current[firstErrorField]) {
      fieldRefs.current[firstErrorField].focus();
    }
  }, [baseForm.errors]);

  // 增强的提交处理
  const handleSubmit = useCallback(
    async (e) => {
      await baseForm.handleSubmit(e);

      if (submitFocusError && Object.keys(baseForm.errors).length > 0) {
        focusError();
      }
    },
    [baseForm, submitFocusError, focusError]
  );

  // 监听字段
  const watch = useCallback(
    (name) => {
      if (name) {
        return baseForm.values[name];
      }
      return baseForm.values;
    },
    [baseForm.values]
  );

  // 触发验证
  const trigger = useCallback(
    async (name) => {
      if (name) {
        return await baseForm.validateField(name, baseForm.values[name]);
      }
      return await baseForm.validateForm();
    },
    [baseForm]
  );

  return {
    ...baseForm,
    register,
    unregister,
    handleSubmit,
    watch,
    trigger,
    focusError,
    registeredFields: Array.from(registeredFields),
  };
};

// 表单验证器
const validators = {
  required:
    (message = "此字段为必填项") =>
    (value) => {
      if (!value || (typeof value === "string" && !value.trim())) {
        return message;
      }
      return null;
    },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `最少需要 ${min} 个字符`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `最多允许 ${max} 个字符`;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message || "格式不正确";
    }
    return null;
  },

  email:
    (message = "请输入有效的邮箱地址") =>
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  phone:
    (message = "请输入有效的手机号码") =>
    (value) => {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (value && !phoneRegex.test(value)) {
        return message;
      }
      return null;
    },

  min: (min, message) => (value) => {
    if (value != null && Number(value) < min) {
      return message || `不能小于 ${min}`;
    }
    return null;
  },

  max: (max, message) => (value) => {
    if (value != null && Number(value) > max) {
      return message || `不能大于 ${max}`;
    }
    return null;
  },

  custom: (validator, message) => async (value, values) => {
    try {
      const isValid = await validator(value, values);
      if (!isValid) {
        return message || "验证失败";
      }
      return null;
    } catch (error) {
      return error.message || message || "验证失败";
    }
  },
};

// 使用示例
const BasicFormExample = () => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps,
  } = useForm(
    {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    {
      validationRules: {
        username: [
          validators.required("用户名不能为空"),
          validators.minLength(3, "用户名至少3个字符"),
          validators.maxLength(20, "用户名最多20个字符"),
        ],
        email: [
          validators.required("邮箱不能为空"),
          validators.email("请输入有效的邮箱地址"),
        ],
        password: [
          validators.required("密码不能为空"),
          validators.minLength(6, "密码至少6个字符"),
          validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "密码必须包含大小写字母和数字"
          ),
        ],
        confirmPassword: validators.custom(
          (value, values) => value === values.password,
          "两次输入的密码不一致"
        ),
      },
      onSubmit: async (values) => {
        console.log("提交表单:", values);
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 2000));
        alert("注册成功！");
      },
      onError: (errors) => {
        console.error("表单验证失败:", errors);
      },
    }
  );

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>用户注册</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="username">用户名：</label>
          <input
            {...getFieldProps("username")}
            type="text"
            id="username"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${
                errors.username && touched.username ? "#ff4d4f" : "#d9d9d9"
              }`,
              borderRadius: "4px",
            }}
          />
          {errors.username && touched.username && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.username}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email">邮箱：</label>
          <input
            {...getFieldProps("email")}
            type="email"
            id="email"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${
                errors.email && touched.email ? "#ff4d4f" : "#d9d9d9"
              }`,
              borderRadius: "4px",
            }}
          />
          {errors.email && touched.email && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password">密码：</label>
          <input
            {...getFieldProps("password")}
            type="password"
            id="password"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${
                errors.password && touched.password ? "#ff4d4f" : "#d9d9d9"
              }`,
              borderRadius: "4px",
            }}
          />
          {errors.password && touched.password && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.password}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="confirmPassword">确认密码：</label>
          <input
            {...getFieldProps("confirmPassword")}
            type="password"
            id="confirmPassword"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${
                errors.confirmPassword && touched.confirmPassword
                  ? "#ff4d4f"
                  : "#d9d9d9"
              }`,
              borderRadius: "4px",
            }}
          />
          {errors.confirmPassword && touched.confirmPassword && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            style={{
              padding: "8px 16px",
              backgroundColor: isSubmitting || !isValid ? "#d9d9d9" : "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting || !isValid ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "注册中..." : "注册"}
          </button>

          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            重置
          </button>
        </div>
      </form>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p>表单状态：</p>
        <pre>{JSON.stringify({ values, errors, touched }, null, 2)}</pre>
      </div>
    </div>
  );
};

const AdvancedFormExample = () => {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    errors,
    isSubmitting,
    isValid,
    reset,
  } = useAdvancedForm(
    {
      firstName: "",
      lastName: "",
      email: "",
      age: "",
      interests: [],
    },
    {
      validationRules: {
        firstName: validators.required("姓氏不能为空"),
        lastName: validators.required("名字不能为空"),
        email: [validators.required("邮箱不能为空"), validators.email()],
        age: [
          validators.required("年龄不能为空"),
          validators.min(18, "年龄不能小于18岁"),
          validators.max(100, "年龄不能大于100岁"),
        ],
      },
      onSubmit: async (values) => {
        console.log("提交高级表单:", values);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("提交成功！");
      },
      submitFocusError: true,
      delayError: 300,
    }
  );

  const watchedEmail = watch("email");

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2>高级表单示例</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <label>姓氏：</label>
            <input
              {...register("firstName")}
              type="text"
              style={{
                width: "100%",
                padding: "8px",
                border: `1px solid ${errors.firstName ? "#ff4d4f" : "#d9d9d9"}`,
                borderRadius: "4px",
              }}
            />
            {errors.firstName && (
              <div
                style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.firstName}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label>名字：</label>
            <input
              {...register("lastName")}
              type="text"
              style={{
                width: "100%",
                padding: "8px",
                border: `1px solid ${errors.lastName ? "#ff4d4f" : "#d9d9d9"}`,
                borderRadius: "4px",
              }}
            />
            {errors.lastName && (
              <div
                style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.lastName}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>邮箱：</label>
          <input
            {...register("email")}
            type="email"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${errors.email ? "#ff4d4f" : "#d9d9d9"}`,
              borderRadius: "4px",
            }}
          />
          {errors.email && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.email}
            </div>
          )}
          {watchedEmail && (
            <div
              style={{ color: "#1890ff", fontSize: "12px", marginTop: "4px" }}
            >
              当前邮箱：{watchedEmail}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>年龄：</label>
          <input
            {...register("age")}
            type="number"
            min="18"
            max="100"
            style={{
              width: "100%",
              padding: "8px",
              border: `1px solid ${errors.age ? "#ff4d4f" : "#d9d9d9"}`,
              borderRadius: "4px",
            }}
          />
          {errors.age && (
            <div
              style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
            >
              {errors.age}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            style={{
              padding: "8px 16px",
              backgroundColor: isSubmitting || !isValid ? "#d9d9d9" : "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting || !isValid ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "提交中..." : "提交"}
          </button>

          <button
            type="button"
            onClick={() => trigger()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#52c41a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            验证表单
          </button>

          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            重置
          </button>
        </div>
      </form>
    </div>
  );
};

// 动态表单示例
const DynamicFormExample = () => {
  const [fields, setFields] = useState([{ id: 1, name: "", email: "" }]);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    getFieldProps,
  } = useForm(
    fields.reduce((acc, field) => {
      acc[`name_${field.id}`] = field.name;
      acc[`email_${field.id}`] = field.email;
      return acc;
    }, {}),
    {
      validationRules: fields.reduce((acc, field) => {
        acc[`name_${field.id}`] = validators.required(
          `姓名 ${field.id} 不能为空`
        );
        acc[`email_${field.id}`] = [
          validators.required(`邮箱 ${field.id} 不能为空`),
          validators.email(),
        ];
        return acc;
      }, {}),
      onSubmit: async (values) => {
        console.log("提交动态表单:", values);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("提交成功！");
      },
      enableReinitialize: true,
    }
  );

  const addField = () => {
    const newField = { id: Date.now(), name: "", email: "" };
    setFields((prev) => [...prev, newField]);

    // 更新表单值
    setValues((prev) => ({
      ...prev,
      [`name_${newField.id}`]: "",
      [`email_${newField.id}`]: "",
    }));
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((field) => field.id !== id));

    // 移除表单值
    setValues((prev) => {
      const newValues = { ...prev };
      delete newValues[`name_${id}`];
      delete newValues[`email_${id}`];
      return newValues;
    });
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>动态表单示例</h2>
      <form onSubmit={handleSubmit}>
        {fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h4>联系人 {index + 1}</h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  style={{
                    backgroundColor: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  删除
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label>姓名：</label>
                <input
                  {...getFieldProps(`name_${field.id}`)}
                  type="text"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${
                      errors[`name_${field.id}`] ? "#ff4d4f" : "#d9d9d9"
                    }`,
                    borderRadius: "4px",
                  }}
                />
                {errors[`name_${field.id}`] && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {errors[`name_${field.id}`]}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label>邮箱：</label>
                <input
                  {...getFieldProps(`email_${field.id}`)}
                  type="email"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${
                      errors[`email_${field.id}`] ? "#ff4d4f" : "#d9d9d9"
                    }`,
                    borderRadius: "4px",
                  }}
                />
                {errors[`email_${field.id}`] && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {errors[`email_${field.id}`]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={addField}
            style={{
              padding: "8px 16px",
              backgroundColor: "#52c41a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            添加联系人
          </button>

          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            提交表单
          </button>
        </div>
      </form>
    </div>
  );
};

// 主要演示组件
const FormDemo = () => {
  const [currentExample, setCurrentExample] = useState("basic");

  const examples = {
    basic: <BasicFormExample />,
    advanced: <AdvancedFormExample />,
    dynamic: <DynamicFormExample />,
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>useForm Hook 示例</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setCurrentExample("basic")}
          style={{
            padding: "8px 16px",
            marginRight: "8px",
            backgroundColor: currentExample === "basic" ? "#1890ff" : "#f5f5f5",
            color: currentExample === "basic" ? "white" : "#000",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          基础表单
        </button>

        <button
          onClick={() => setCurrentExample("advanced")}
          style={{
            padding: "8px 16px",
            marginRight: "8px",
            backgroundColor:
              currentExample === "advanced" ? "#1890ff" : "#f5f5f5",
            color: currentExample === "advanced" ? "white" : "#000",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          高级表单
        </button>

        <button
          onClick={() => setCurrentExample("dynamic")}
          style={{
            padding: "8px 16px",
            backgroundColor:
              currentExample === "dynamic" ? "#1890ff" : "#f5f5f5",
            color: currentExample === "dynamic" ? "white" : "#000",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          动态表单
        </button>
      </div>

      {examples[currentExample]}
    </div>
  );
};

export default FormDemo;

export {
  AdvancedFormExample,
  BasicFormExample,
  DynamicFormExample,
  useAdvancedForm,
  useForm,
  validators,
};

/**
 * 面试要点总结：
 *
 * 1. 状态管理：
 *    - 表单值状态
 *    - 错误状态
 *    - 触摸状态
 *    - 提交状态
 *
 * 2. 验证机制：
 *    - 实时验证
 *    - 失焦验证
 *    - 提交验证
 *    - 异步验证
 *
 * 3. 性能优化：
 *    - useCallback 缓存函数
 *    - useMemo 缓存计算
 *    - 避免不必要的重新渲染
 *    - 延迟验证
 *
 * 4. 用户体验：
 *    - 错误提示
 *    - 加载状态
 *    - 焦点管理
 *    - 可访问性
 *
 * 5. 扩展性：
 *    - 自定义验证器
 *    - 动态字段
 *    - 字段注册
 *    - 插件机制
 */
