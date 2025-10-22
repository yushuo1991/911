# 图表标签不显示问题深度诊断

## 问题描述
用户反馈7天排行图和日期模态框图中,峰值标签仍然不显示。

## 已确认的事实
1. ✅ label函数已编译到服务器代码中 (grep确认)
2. ✅ 服务器正常运行 (PM2 online, 网站可访问)
3. ✅ 本地代码已移除调试日志
4. ✅ 构建成功,无错误

## 深度思考分析

### 可能原因1: Recharts Label渲染机制问题 ⚠️ **最可能**

**推理**:
- Recharts的`label`属性接受函数时,函数返回值必须是**React元素**或**配置对象**
- 我当前返回的是 `<text>` JSX元素
- 但在Recharts编译后的环境中,可能需要显式导入`React`或使用`React.createElement`

**证据**:
```typescript
// 当前代码
label={(props: any) => {
  return <text>...</text>; // 可能在运行时JSX转换失败
}}
```

**Recharts官方推荐**:
```typescript
// 方式1: 返回配置对象
label={{
  position: 'top',
  content: (props) => props.value
}}

// 方式2: 使用LabelList组件
<LabelList dataKey="name" position="top" />
```

### 可能原因2: 数据结构不匹配

**推理**:
- `props.payload[sector.name]` 可能访问不到正确的值
- 数据键名可能与预期不符

**需要验证**:
- `dates`数组是否正确传入闭包
- `getSectorStrengthRanking`数据结构
- `props.payload`的实际内容

### 可能原因3: 条件判断过于严格

**推理**:
```typescript
if (currentValue === maxForDate) // 严格相等
```
- 浮点数精度问题
- 多个板块同时达到最大值时,只显示第一个

### 可能原因4: SVG渲染层级问题

**推理**:
- `<text>` 元素可能被其他元素遮挡
- z-index在SVG中不生效,需要调整DOM顺序

## 解决方案

### 方案A: 使用Recharts LabelList组件 ✅ **推荐**

```tsx
import { LabelList } from 'recharts';

<Line dataKey={sector.name} ...>
  <LabelList
    dataKey={sector.name}
    position="top"
    content={(props) => {
      const { x, y, value, index } = props;
      // 判断逻辑
      if (isMaxValue) {
        return (
          <text x={x} y={y - 10} fill={color} fontSize={11}>
            {sector.name}
          </text>
        );
      }
      return null;
    }}
  />
</Line>
```

### 方案B: 返回label配置对象

```tsx
label={(props) => {
  if (!shouldShowLabel) return null;

  return {
    value: sector.name,
    position: 'top',
    offset: 10,
    fill: color,
    fontSize: 11,
    fontWeight: 'bold'
  };
}}
```

### 方案C: 使用ReferenceDot标记峰值

```tsx
{maxPoints.map((point, i) => (
  <ReferenceDot
    key={i}
    x={point.date}
    y={point.value}
    label={{ value: point.name, position: 'top' }}
  />
))}
```

## 下一步行动

1. **验证数据**: 在浏览器Console中输出`props.payload`确认数据结构
2. **简化条件**: 先让所有点都显示标签,确认渲染机制工作
3. **切换方案**: 使用`<LabelList>`组件替代`label`函数
4. **检查导入**: 确认`recharts`版本和`Text`组件导入

## 测试代码片段

```typescript
// 测试1: 所有点都显示标签
label={(props: any) => {
  return (
    <text x={props.x} y={props.y - 10} fill="red" fontSize={11}>
      TEST
    </text>
  );
}}

// 测试2: 使用value而非JSX
label={(props: any) => {
  return { value: "TEST", position: "top" };
}}

// 测试3: 检查props结构
label={(props: any) => {
  console.log('LABEL_PROPS:', props);
  return null;
}}
```

## 结论

**最可能的问题**: Recharts的`label`函数返回JSX在编译环境中可能不工作。

**建议方案**: 切换到`<LabelList>`组件或返回配置对象。
