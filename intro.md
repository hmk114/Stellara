# STELLARA 大作业文档

> 未央-软件21 贾泽林 姚汝昌 韩枢辰 伍圣贤

## 一、使用说明

### 1.1 项目运行
在项目根目录下运行以下命令：
```shell
npx vite
```

### 1.2 项目结构

```shell
.
├── README.md
├── index.html
├── main.js
├── stellara
│   ├── core
│   │   ├── app.js
│   │   ├── celestial_object.js
│   │   └── constant.js
│   │   └── mesh.js
│   │   └── rotation.js
│   │   └── shader_patcher.js
│   │   └── solar_system_data.js
│   │   └── solar_system_objects.js
│   └── assets
│       ├── texture
│       │   ├── earth.jpg
│       │   ├── earth_water.jpg
│       │   ├── moon.jpg
│       │   ├── sun.jpg
```

## 二、实现思路

本项目基于Three.js实现，主要分为以下几个部分：

### 2.1 场景搭建

#### 2.1.1 创建星体
编写类`CelestialObject`，用于创建星体对象。星体对象包括名称、贴图、轨道、自转、子星体等基本信息，以及若干方法用于更新星体状态。

#### 2.1.2 贴图渲染

- mesh贴图

- shader重构

#### 2.1.3 星体运动

- 轨迹

- 自转

### 2.2 页面逻辑

#### 2.2.1 渲染逻辑
本项目基于Three.js的渲染引擎，每一帧调用`app.animate()`方法，渲染整个场景。在本项目中，我们在同一场景下使用两个相机和两个渲染器，分别渲染主视角和星体视角，后者用于展示特殊天文现象（日食、月食等）。

- 主视角
主视角用于展示整个太阳系的运行情况，包括各个行星的运行轨迹、自转等。用户可以切换视野中心并控制缩放，基于`OrbitControls`实现。用户可以通过按钮或直接点击，切换视野中心的星体。

- 星体视角
本部分用于展示日食、月食等特殊天文现象。此视角仅在特定条件下展示，如用户点击日食按钮，会模拟地球表面观测日食的情况；用户点击月食按钮，会模拟月球表面观测的视角。

#### 2.2.2 交互控制
eventBus...

#### 2.2.3 界面设计

css...

## 三、实现效果

## 四、参考资料

- [Three.js](https://threejs.org/)
- [Three.js Examples](https://threejs.org/examples/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Celestia](https://celestiaproject.space/)
- [NASA Orbit Viewer](https://ssd.jpl.nasa.gov/tools/orbit_viewer.html)
- [Planet Texture Maps](https://planetpixelemporium.com/earth.html)