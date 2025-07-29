# RBAC系统设计相关问题 - 前端面试指南

## 📋 常见面试题与答案

### Q1: 什么是RBAC？如何设计一个完整的RBAC权限系统？

**标准答案：**
RBAC(Role-Based Access Control)是基于角色的访问控制，通过用户-角色-权限的三层模型实现精细化权限管理。

**面试回答技巧：**
```javascript
// RBAC 核心模型设计
class RBACSystem {
  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map(); // 用户-角色关系
    this.rolePermissions = new Map(); // 角色-权限关系
  }

  // 检查用户权限
  hasPermission(userId, permission) {
    const userRoles = this.userRoles.get(userId) || [];
    return userRoles.some(roleId => {
      const rolePerms = this.rolePermissions.get(roleId) || [];
      return rolePerms.includes(permission);
    });
  }
}
```

**详细解答：**
1. **用户(User)**：系统的操作主体
2. **角色(Role)**：权限的集合，如管理员、编辑者
3. **权限(Permission)**：具体的操作权限
4. **分配关系**：用户分配角色，角色拥有权限

### Q2: 前端如何实现动态权限控制？路由和组件权限如何处理？

**标准答案：**
前端权限控制通过路由守卫、组件级权限指令、菜单动态生成等方式实现。

**面试回答技巧：**
```javascript
// Vue路由权限控制
const router = createRouter({
  routes: [
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, permissions: ['admin:read'] }
    }
  ]
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const hasPermission = await checkPermission(to.meta.permissions);
    next(hasPermission ? true : '/403');
  } else {
    next();
  }
});

// React权限Hook
function usePermission(permission) {
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const check = async () => {
      const result = await rbacService.hasPermission(permission);
      setHasPermission(result);
    };
    check();
  }, [permission]);
  
  return hasPermission;
}
```

**详细解答：**
- **路由级权限**：通过路由守卫控制页面访问
- **组件级权限**：通过权限指令控制组件显示
- **按钮级权限**：控制操作按钮的可见性
- **数据级权限**：控制数据的访问范围

### Q3: 如何设计权限的继承和层级关系？

**标准答案：**
通过角色继承、权限树结构、部门层级等方式实现权限的层级管理。

**面试回答技巧：**
```javascript
class HierarchicalRBAC {
  constructor() {
    this.roleHierarchy = new Map(); // 角色继承关系
    this.permissionTree = new Map(); // 权限树结构
  }

  // 角色继承
  setRoleInheritance(childRole, parentRole) {
    this.roleHierarchy.set(childRole, parentRole);
  }

  // 获取用户的所有权限（包括继承的）
  getUserPermissions(userId) {
    const directRoles = this.getUserRoles(userId);
    const allRoles = this.expandRoles(directRoles);
    return this.getRolePermissions(allRoles);
  }

  expandRoles(roles) {
    const expanded = new Set(roles);
    roles.forEach(role => {
      const parent = this.roleHierarchy.get(role);
      if (parent) expanded.add(parent);
    });
    return Array.from(expanded);
  }
}
```

**详细解答：**
- **角色继承**：子角色自动拥有父角色的权限
- **权限树**：权限按功能模块组织成树状结构
- **部门权限**：基于组织架构的权限管理
- **临时授权**：支持临时权限分配

### Q4: 大型系统中RBAC如何处理性能问题？

**标准答案：**
通过权限缓存、批量查询、权限预计算等方式优化RBAC系统性能。

**面试回答技巧：**
```javascript
class PerformantRBAC {
  constructor() {
    this.permissionCache = new LRUCache(1000);
    this.userPermissionMap = new Map(); // 预计算用户权限
  }

  async hasPermission(userId, permission) {
    const cacheKey = `${userId}:${permission}`;
    let result = this.permissionCache.get(cacheKey);
    
    if (result === undefined) {
      result = await this.computePermission(userId, permission);
      this.permissionCache.set(cacheKey, result);
    }
    
    return result;
  }

  // 权限预计算
  async precomputeUserPermissions(userId) {
    const roles = await this.getUserRoles(userId);
    const permissions = await this.getRolePermissions(roles);
    this.userPermissionMap.set(userId, new Set(permissions));
  }
}
```

**详细解答：**
- **缓存策略**：LRU缓存热点权限查询
- **批量操作**：减少数据库查询次数
- **权限预计算**：登录时计算用户所有权限
- **增量更新**：权限变更时只更新相关缓存

### Q5: 如何设计支持多租户的RBAC系统？

**标准答案：**
通过租户隔离、权限模板、数据隔离等方式支持多租户场景。

**面试回答技巧：**
```javascript
class MultiTenantRBAC {
  constructor() {
    this.tenants = new Map();
    this.roleTemplates = new Map(); // 角色模板
  }

  // 租户级权限检查
  hasPermission(tenantId, userId, permission) {
    const tenant = this.tenants.get(tenantId);
    return tenant?.rbac.hasPermission(userId, permission) || false;
  }

  // 创建租户并应用角色模板
  createTenant(tenantId, template) {
    const rbac = new RBACSystem();
    const roleTemplate = this.roleTemplates.get(template);
    
    // 应用模板角色和权限
    roleTemplate.roles.forEach(role => {
      rbac.createRole(role.id, role.permissions);
    });
    
    this.tenants.set(tenantId, { rbac });
  }
}
```

**详细解答：**
- **租户隔离**：每个租户独立的权限体系
- **角色模板**：标准化的角色配置模板
- **跨租户管理**：平台管理员的超级权限
- **数据隔离**：确保租户数据安全隔离

## 🎯 面试技巧总结

### 回答策略

**1. 从业务理解出发**
- 先理解业务需求，再设计技术方案
- 考虑不同角色的实际工作场景

**2. 强调可扩展性**
- 设计要支持业务增长和变化
- 考虑权限粒度的动态调整

**3. 关注性能和用户体验**
- 权限检查不能影响系统性能
- 前端权限控制要有良好的用户体验

### 加分点

1. **实际项目经验**：分享具体的RBAC实现案例
2. **安全考虑**：了解权限系统的安全风险
3. **性能优化**：有大规模权限系统的优化经验
4. **多场景支持**：考虑多租户、微服务等复杂场景

### 常见误区

1. **过度设计**：不要设计过于复杂的权限体系
2. **前端依赖**：不能只在前端做权限控制
3. **性能忽视**：忽视权限检查对性能的影响
4. **用户体验差**：权限控制影响正常使用流程

### 面试准备清单

- [ ] 理解RBAC的核心概念和模型
- [ ] 掌握前端权限控制的常见实现方式
- [ ] 了解权限系统的性能优化方案
- [ ] 准备多租户权限设计的思路
- [ ] 熟悉权限系统的安全最佳实践

## 💡 总结

RBAC系统设计的核心要点：

1. **清晰的权限模型**：用户-角色-权限的三层模型
2. **灵活的权限粒度**：支持页面、组件、数据等多级权限
3. **高效的权限检查**：通过缓存和预计算提升性能
4. **良好的可扩展性**：支持权限继承和动态配置
5. **完善的安全机制**：防止权限绕过和提权攻击

面试时要重点展示：
- 对权限模型的深入理解
- 前后端权限控制的完整方案
- 大规模权限系统的设计经验
- 权限系统与业务场景的结合能力 