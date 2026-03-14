# 音效系统补充计划

## 目标
为游戏添加完整的音效系统，包括：武器挥动音效、武器击打音效、击杀音效、背景音乐

## 现有资源
- `assets/sounds/blade_swish.js` - 已有的挥刀音效

## 需要完成的任务

### 1. 扩展 AudioManager 类
- [ ] 添加音效音量控制方法
- [ ] 添加预加载音效方法
- [ ] 添加音效枚举定义

### 2. 创建音效资源文件
- [ ] 创建音效资源配置
- [ ] 添加各类型武器挥动音效
- [ ] 添加击打音效
- [ ] 添加击杀音效
- [ ] 添加背景音乐

### 3. 在 GameScene 中集成音效
- [ ] 初始化 AudioManager
- [ ] 武器挥动时播放音效
- [ ] 武器击中目标时播放击打音效
- [ ] 敌人死亡时播放击杀音效
- [ ] 游戏开始时播放背景音乐

### 4. 音效触发时机
- [ ] 武器挥动音效：每次攻击时
- [ ] 击打音效：武器命中敌人时
- [ ] 击杀音效：敌人死亡时
- [ ] 背景音乐：游戏开始时循环播放

## 实现细节

### 音效类型
```typescript
enum SoundType {
    // 武器挥动
    SWORD_SWING = 'sword_swing',
    AXE_SWING = 'axe_swing',
    SPEAR_SWING = 'spear_swing',
    HAMMER_SWING = 'hammer_swing',
    DAGGER_SWING = 'dagger_swing',
    
    // 击打
    HIT = 'hit',
    
    // 击杀
    KILL = 'kill',
    
    // 背景音乐
    BACKGROUND_MUSIC = 'background_music'
}
```

### 音效触发位置
- 武器挥动：Blade.ts update() 方法中
- 击打音效：GameScene.ts collision 处理中
- 击杀音效：GameScene.ts 敌人死亡逻辑中
- 背景音乐：GameScene.ts create() 中

## 预期效果
- 玩家攻击时有对应的武器挥动声
- 武器击中敌人时有击打声
- 敌人被击杀时有击杀音效
- 游戏运行时背景音乐循环播放
