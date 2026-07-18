# 图片来源与授权

本原型中的照片均下载自 Wikimedia Commons，并保存在 `assets/images/` 供本地演示使用。

- `shenzhen-mangrove.jpg`：LEE3Lithium，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:一颗生长在深圳湾的红树.jpg
- `black-faced-spoonbill.jpg`：Charles Lam，CC BY-SA 2.0，https://commons.wikimedia.org/wiki/File:Platalea_minor.jpg
- `mangrove-wetland.jpg`：Ycpaxu，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Danshuei_River_Mangrove_Wetland-_LEE-CHI-AN-1.jpg
- `kandelia-obovata.jpg`：Minghong，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Kandelia_obovata_1.jpg
- `fiddler-crab.jpg`：Charles J. Sharp，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Compressed_fiddler_crab_(Uca_coarctata)_male.jpg
- `little-egret.jpg`：Laitche，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Egretta_garzetta_2015-06-17.jpg

物种图片仅用于腾讯青科实训营课题原型展示。若用于公开部署或商业用途，需继续遵守对应许可证的署名、相同方式共享等要求。

## 品牌与地图

- `brand-logo-source.png`：Mudflat Go! 团队品牌图，来自同团队前端仓库 https://github.com/A-Rosetta/MudflatGo 。
- `brand-mark.png`：由上述品牌图进行非破坏性方形裁切，用于导航栏小尺寸展示。
- `assets/map/`：OpenStreetMap 标准地图瓦片，© OpenStreetMap contributors，页面内保留可见署名。数据许可见 https://www.openstreetmap.org/copyright 。
- Leaflet 1.9.4，BSD-2-Clause License，https://leafletjs.com/ 。页面使用本地 Leaflet 运行文件加载 OpenStreetMap 在线瓦片；仓库内静态瓦片作为加载前和断网回退。
- `mudskipper.jpg`：`Boleophthalmus pectinirostris in Hong Kong Wetlands`，TWKnowledge，CC BY-SA 4.0，Wikimedia Commons。
- `avicenna-marina.jpg`：`Avicennia marina (grey mangrove)`，AntanO，CC BY-SA 3.0，Wikimedia Commons。
- `common-kingfisher.jpg`：`Common kingfisher (Alcedo atthis ispida) female`，Charles J. Sharp，CC BY-SA 4.0，Wikimedia Commons。
- `mangrove-snail.jpg`：`Cerithidea rhizophorarum`，M Cheung，CC BY 2.0，Wikimedia Commons。
- `night-heron.jpg`：`Black-crowned night heron at Tennōji Park in Osaka, March 2016`，Laitche，CC BY-SA 4.0，Wikimedia Commons。

## 浏览器端机器学习

- TensorFlow.js 4.22.0，Apache License 2.0，https://github.com/tensorflow/tfjs 。
- TensorFlow.js MobileNet 2.1.1，Apache License 2.0，https://github.com/tensorflow/tfjs-models/tree/master/mobilenet 。
- MobileNet V2 0.5 ImageNet classification 模型来自 Google TensorFlow Hub/Kaggle Models；模型文件保存在 `assets/models/mobilenet/`，仅在浏览器本地执行推理。
- `chriamue/bird-species-classifier` EfficientNet B2 鸟类分类权重，MIT License，固定来源提交 `558944ca4448f5b311af8393c8b894eff20a06da`，https://huggingface.co/chriamue/bird-species-classifier 。本项目从 `model.safetensors` 权重重新导出，将不兼容的自适应池化导出替换为数学等价的空间均值，并转换为 FP16 ONNX；未使用模型仓库自带的 ONNX 文件。
- ONNX Runtime Web 1.22.0，MIT License，https://github.com/microsoft/onnxruntime 。运行文件保存在 `assets/vendor/`，用于浏览器本地鸟类模型推理。

## 鸟鸣录音

- `black-faced-spoonbill.mp3`：Black-faced Spoonbill `XC134758`，John Wright，CC BY-NC-SA 3.0，https://xeno-canto.org/134758 。仅用于当前非商业课题原型。
- `little-egret.mp3`：Little Egret `XC432219`，Joost van Bruggen，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Egretta_garzetta_-_Little_Egret_XC432219.mp3
- `common-kingfisher.mp3`：Common Kingfisher `XC476785`，Marie-Lan Taÿ Pamart，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Alcedo_atthis_-_Common_Kingfisher_XC476785.mp3
- `night-heron.mp3`：Black-crowned Night Heron `XC543137`，Luis Alvarez Menendez，CC BY-SA 4.0，https://commons.wikimedia.org/wiki/File:Nycticorax_nycticorax_-_Black-crowned_Night_Heron_XC543137.mp3

录音文件保存在 `assets/audio/birds/`，由浏览器本地播放，不在响铃时连接第三方服务。请勿在野外用鸟鸣吸引、惊扰或改变鸟类行为。
