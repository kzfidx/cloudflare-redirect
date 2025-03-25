# Cloudflare 域名重定向 Worker
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kzfidx/cloudflare-redirect/worker)

这是一个基于Cloudflare Workers的域名重定向解决方案，能够实现以下功能：
## 主要功能

1. **域名重定向**：将访问源域名（SOURCE_DOMAIN）的请求透明地代理到目标域名（TARGET_DOMAIN）并保持路径不变
2. **SEO优化**：自动替换页面中的标题、描述等SEO元数据
3. **资源代理**：正确处理JavaScript、CSS等静态资源请求
4. **API代理**：支持API请求的转发
5. **链接修复**：自动修复页面中的所有链接，确保它们指向源域名
6. **Google Analytics**：支持集成Google Analytics
7. **robots.txt和sitemap.xml**：自动生成SEO相关文件
8. **安全增强**：添加X-Frame-Options等安全头

## 使用步骤

1. 创建CNAME解析：
   - 登录Cloudflare控制台
   - 选择你的源域名
   - 在DNS设置中添加一条CNAME记录：
     - 名称：@ 或你想要的子域名
     - 目标：`${TARGET_DOMAIN}`
     - 代理状态：已代理（橙色云图标）

2. 部署代码到Cloudflare Workers：
   - 在Cloudflare控制台中选择"Workers"
   - 点击"创建服务"
   - 输入服务名称
   - 选择"HTTP handler"模板
   - 将`_worker.js`的内容粘贴到代码编辑器中
   - 点击"保存并部署"

3. 配置Worker参数：
   - 在Worker设置中选择"设置" -> "变量"
   - 添加以下环境变量（可选）：
     - `SOURCE_DOMAIN`
     - `TARGET_DOMAIN`
     - `PAGE_TITLE`
     - `PAGE_DESCRIPTION`
     - `GA_ID`
   - 在"触发器"中绑定你的源域名

4. 验证部署：
   - 访问你的源域名，确认请求被正确代理到目标域名
   - 检查页面元素，确保所有链接和资源都指向源域名


## 注意事项

1. 确保源域名和目标域名都已正确配置SSL证书
2. 如果使用Google Analytics，请确保GA ID正确
3. 该解决方案适用于大多数网站，但对于使用复杂JavaScript框架的网站可能需要额外调整

* 本项目所有内容均来自AI生成
