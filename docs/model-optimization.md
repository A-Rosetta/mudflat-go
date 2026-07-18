# Blind-box model optimization

Generated with `@gltf-transform/cli@4.2.1` after reviewing the CLI, `optimize`, and `simplify` help.

| Model | Source size | Final size | Triangles | Texture format / max size |
| --- | ---: | ---: | ---: | --- |
| White-rumped munia | 74,417,036 bytes | 2,330,192 bytes | 1,500,000 -> 750,000 | WebP / 1024x1024 |
| Common tailorbird | 78,183,128 bytes | 2,341,284 bytes | 1,500,000 -> 750,000 | WebP / 1024x1024 |

Both outputs use `KHR_draco_mesh_compression` and `EXT_texture_webp`. `gltf-transform validate` reports no errors for either model; each reports one generated tangent-space warning. The source assets are intentionally excluded from the repository.

```powershell
npx -y @gltf-transform/cli@4.2.1 optimize <input.glb> <output.glb> --compress draco --texture-compress webp --texture-size 1024 --simplify true --simplify-ratio 0.5 --simplify-error 1
```
