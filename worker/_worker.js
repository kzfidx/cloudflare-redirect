// ===== 修复后的完整代码 =====
// 定义默认配置
const DEFAULT_CONFIG = {
  SOURCE_DOMAIN: '',
  TARGET_DOMAIN: '',
  PAGE_TITLE: '',
  PAGE_DESCRIPTION: '',
  GA_ID: '',
  ADSENSE_ID: '',
  USE_PERMANENT_REDIRECT: true,
  REWRITE_IMAGE_URLS: true, // 是否重写图片URL
};

// MetaRewriter类 - 处理元标签
class MetaRewriter {
  element(element) {
    // 可以在这里添加对meta标签的处理逻辑
  }
}

// HeadRewriter类 - 处理头部内容
class HeadRewriter {
  element(element) {
    // 可以在这里添加对head标签的处理逻辑
  }
}

// BodyRewriter类 - 处理正文内容
class BodyRewriter {
  constructor(config) {
    this.config = config || DEFAULT_CONFIG;
    this.customScript = config.GA_ID ? `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${config.GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${config.GA_ID}');
  </script>` : '';
    this.adsenseScript = config.ADSENSE_ID ? `<!-- Google Adsense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.ADSENSE_ID}" crossorigin="anonymous"></script>` : '';
  }

  element(element) {
    // 根据配置决定是否生成图片URL替换逻辑
    const imageProcessingCode = this.config.REWRITE_IMAGE_URLS ? `
    // 增强的图片URL特殊处理函数
    function fixImageUrls() {
        // 1. 处理所有图片标签
        const images = document.querySelectorAll('img:not([data-fixed-img])');
        images.forEach(img => {
            try {
                // 处理所有可能的图片源属性
                const srcAttributes = ['src', 'srcset', 'data-src', 'data-srcset', 'data-original', 'data-lazy-src', 'data-bgset', 'data-bg', 'data-image', 'data-background-image'];
                
                srcAttributes.forEach(attr => {
                    if (img.hasAttribute(attr)) {
                        const src = img.getAttribute(attr);
                        if (src && (src.includes(TARGET_DOMAIN) || src.includes(encodeURIComponent(TARGET_DOMAIN)))) {
                            // 增强的URL替换逻辑，处理各种编码和格式
                            let fixedSrc = src.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                            fixedSrc = fixedSrc.replace(new RegExp(encodeURIComponent(TARGET_DOMAIN), 'g'), encodeURIComponent(SOURCE_DOMAIN));
                            fixedSrc = fixedSrc.replace(new RegExp(encodeURI(TARGET_DOMAIN), 'g'), encodeURI(SOURCE_DOMAIN));
                            
                            img.setAttribute(attr, fixedSrc);
                            
                            // 如果是主要的src属性，刷新图片
                            if (attr === 'src' && img.complete) {
                                const tempSrc = img.src;
                                img.src = '';
                                img.src = tempSrc;
                            }
                        }
                    }
                });
                
                img.setAttribute('data-fixed-img', 'true');
            } catch (e) {
                console.error('Error fixing image:', e);
            }
        });
        
        // 2. 处理样式中的背景图片
        const styleElements = document.querySelectorAll('[style]:not([data-fixed-style])');
        styleElements.forEach(el => {
            try {
                const style = el.getAttribute('style');
                if (style && (style.includes(TARGET_DOMAIN) || style.includes(encodeURIComponent(TARGET_DOMAIN)))) {
                    let fixedStyle = style.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                    fixedStyle = fixedStyle.replace(new RegExp(encodeURIComponent(TARGET_DOMAIN), 'g'), encodeURIComponent(SOURCE_DOMAIN));
                    fixedStyle = fixedStyle.replace(new RegExp(encodeURI(TARGET_DOMAIN), 'g'), encodeURI(SOURCE_DOMAIN));
                    
                    el.setAttribute('style', fixedStyle);
                    el.setAttribute('data-fixed-style', 'true');
                }
            } catch (e) {
                console.error('Error fixing style:', e);
            }
        });
        
        // 3. 处理CSS变量中的图片URL
        const rootStyle = document.documentElement.style;
        if (!document.documentElement.hasAttribute('data-fixed-cssvars')) {
            try {
                const computedStyle = getComputedStyle(document.documentElement);
                for (let i = 0; i < computedStyle.length; i++) {
                    const prop = computedStyle[i];
                    if (prop.startsWith('--')) {
                        const value = computedStyle.getPropertyValue(prop);
                        if (value && (value.includes(TARGET_DOMAIN) || value.includes(encodeURIComponent(TARGET_DOMAIN)))) {
                            let fixedValue = value.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                            fixedValue = fixedValue.replace(new RegExp(encodeURIComponent(TARGET_DOMAIN), 'g'), encodeURIComponent(SOURCE_DOMAIN));
                            fixedValue = fixedValue.replace(new RegExp(encodeURI(TARGET_DOMAIN), 'g'), encodeURI(SOURCE_DOMAIN));
                            
                            rootStyle.setProperty(prop, fixedValue);
                        }
                    }
                }
                document.documentElement.setAttribute('data-fixed-cssvars', 'true');
            } catch (e) {
                console.error('Error fixing CSS variables:', e);
            }
        }
        
        // 4. 处理picture标签内的source元素
        const sources = document.querySelectorAll('source:not([data-fixed-source])');
        sources.forEach(source => {
            try {
                const srcset = source.getAttribute('srcset');
                const media = source.getAttribute('media');
                const sizes = source.getAttribute('sizes');
                
                if (srcset && (srcset.includes(TARGET_DOMAIN) || srcset.includes(encodeURIComponent(TARGET_DOMAIN)))) {
                    let fixedSrcset = srcset.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                    fixedSrcset = fixedSrcset.replace(new RegExp(encodeURIComponent(TARGET_DOMAIN), 'g'), encodeURIComponent(SOURCE_DOMAIN));
                    fixedSrcset = fixedSrcset.replace(new RegExp(encodeURI(TARGET_DOMAIN), 'g'), encodeURI(SOURCE_DOMAIN));
                    
                    source.setAttribute('srcset', fixedSrcset);
                    
                    // 触发父级picture元素的图片重新加载
                    const picture = source.closest('picture');
                    if (picture) {
                        const img = picture.querySelector('img');
                        if (img && img.src) {
                            const tempSrc = img.src;
                            img.src = '';
                            img.src = tempSrc;
                        }
                    }
                }
                
                source.setAttribute('data-fixed-source', 'true');
            } catch (e) {
                console.error('Error fixing source:', e);
            }
        });
    }` : `
    // 不执行图片URL替换
    function fixImageUrls() {}
    `;

    // 生成客户端JavaScript代码，用于在浏览器端继续修复链接和资源
    const clientScript = `
    <div style="display:none">Powered by Cloudflare Workers</div>
    <script>
    (function() {
        try {
            const TARGET_DOMAIN = '${this.config.TARGET_DOMAIN}';
            const SOURCE_DOMAIN = '${this.config.SOURCE_DOMAIN}';
            let lastFixedUrl = window.location.href;
            
            ${imageProcessingCode}
            
            // 原有fixLinks函数的其他部分保持不变
            function fixLinks() {
                try {
                    // 仅当URL变化时才执行链接修复
                    if (window.location.href !== lastFixedUrl) {
                        lastFixedUrl = window.location.href;
                        
                        const links = document.querySelectorAll('a:not([data-fixed])');
                        links.forEach(link => {
                            if (link.href && link.href.includes(TARGET_DOMAIN)) {
                                link.href = link.href.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                                link.setAttribute('data-fixed', 'true');
                            }
                            // 改进mailto链接处理
                            if (link.href && link.href.includes('/cdn-cgi/l/email-protection')) {
                                try {
                                    const decodedEmail = decodeEmail(link.href);
                                    link.href = 'mailto:' + decodedEmail;
                                    link.textContent = 'Email';
                                    link.classList.add('email-link');
                                    link.title = '发送邮件至 ' + decodedEmail;
                                    link.setAttribute('data-fixed', 'true');
                                } catch (e) {
                                    console.error('Email decode error:', e);
                                }
                            }
                        });
                    }
                    
                    // 其他需要定期检查的元素
                    const updateSrcAttributes = (elements, attribute) => {
                        elements.forEach(el => {
                            if (!el.hasAttribute('data-fixed')) {
                                const src = el.getAttribute(attribute);
                                if (src && src.includes(TARGET_DOMAIN)) {
                                    el.setAttribute(attribute, src.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN));
                                    el.setAttribute('data-fixed', 'true');
                                }
                            }
                        });
                    };
                    
                    // 调用图片URL修复函数（根据配置决定是否实际执行替换）
                    fixImageUrls();
                    
                    updateSrcAttributes(document.querySelectorAll('script:not([data-fixed])'), 'src');
                    updateSrcAttributes(document.querySelectorAll('link:not([data-fixed])'), 'href');
                    updateSrcAttributes(document.querySelectorAll('form:not([data-fixed])'), 'action');
                    updateSrcAttributes(document.querySelectorAll('meta[content]:not([data-fixed])'), 'content');
                } catch (e) {
                    console.error('Error in fixLinks:', e);
                }
            }
            
            // 邮件解码函数和其他原有代码保持不变
            function decodeEmail(encoded) {
                try {
                    // 获取加密部分
                    const encryptedPart = encoded.split('#')[1];
                    if (!encryptedPart) {
                        throw new Error('Invalid email protection format');
                    }
                    
                    // 获取密钥
                    const key = parseInt(encryptedPart.substr(0, 2), 16);
                    if (isNaN(key)) {
                        throw new Error('Invalid key');
                    }
                    
                    // 解码邮件地址
                    let decoded = '';
                    for (let i = 2; i < encryptedPart.length; i += 2) {
                        const hex = encryptedPart.substr(i, 2);
                        const charCode = parseInt(hex, 16) ^ key;
                        decoded += String.fromCharCode(charCode);
                    }
                    return decoded;
                } catch (e) {
                    console.error('Decode error:', e);
                    throw e;
                }
            }
            
            // 立即执行一次
            fixLinks();
            
            // 使用MutationObserver监听DOM变化，但添加节流
            let mutationTimeout;
            const observer = new MutationObserver(function() {
                if (mutationTimeout) clearTimeout(mutationTimeout);
                mutationTimeout = setTimeout(fixLinks, 100);
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
            
            // 重写location方法以确保域名替换
            const originalAssign = window.location.assign;
            window.location.assign = function(url) {
                if (url.includes(TARGET_DOMAIN)) {
                    url = url.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                }
                return originalAssign.call(window.location, url);
            };
            
            const originalReplace = window.location.replace;
            window.location.replace = function(url) {
                if (url.includes(TARGET_DOMAIN)) {
                    url = url.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                }
                return originalReplace.call(window.location, url);
            };
            
            // 重写history方法以确保域名替换
            const originalPushState = history.pushState;
            history.pushState = function() {
                if (arguments[2] && typeof arguments[2] === 'string') {
                    arguments[2] = arguments[2].replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                }
                return originalPushState.apply(this, arguments);
            };
            
            const originalReplaceState = history.replaceState;
            history.replaceState = function() {
                if (arguments[2] && typeof arguments[2] === 'string') {
                    arguments[2] = arguments[2].replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                }
                return originalReplaceState.apply(this, arguments);
            };
            
            // 检查并修复当前URL
            if (window.location.href.includes(TARGET_DOMAIN)) {
                const newUrl = window.location.href.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
                window.history.replaceState({}, document.title, newUrl);
            }
            
            // 增加频率的定期检查，确保动态加载的图片也能被处理
            setInterval(fixImageUrls, 500);
        } catch (e) {
            console.error('Error in main script:', e);
        }
    })();
    </script>`;

        // 将客户端脚本和其他脚本添加到body末尾
        element.append(clientScript, {
            html: true
        });
        
        // 添加Adsense脚本（如果有）
        if (this.adsenseScript) {
            element.append(this.adsenseScript, {
                html: true
            });
        }
        
        // 再次添加自定义脚本（确保在body末尾也有）
        if (this.customScript) {
            element.append(this.customScript, {
                html: true
            });
        }
    }
}

// ========== 辅助函数 ==========
/**
 * 生成基本站点地图响应
 */
function generateSitemapResponse(domain) {
  const sitemapContent = generateSitemap(domain);
  let response = new Response(sitemapContent);
  response.headers.set('content-type', 'application/xml');
  return response;
}

/**
 * 生成基本站点地图
 */
function generateSitemap(domain) {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
}

/**
 * 处理OPTIONS请求
 */
function handleOptions(request) {
  // 处理CORS预检请求
  if (request.headers.has('Origin') &&
      request.headers.has('Access-Control-Request-Method')) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return new Response(null, {
    headers: {
      Allow: 'GET, HEAD, POST, OPTIONS',
    },
  });
}

// ========== 主函数 ==========
async function fetchAndApply(request, env) {
  // 合并配置
  const config = {
    ...DEFAULT_CONFIG,
    ...env,
  };

  // 验证配置有效性
  if (!config.SOURCE_DOMAIN || !config.TARGET_DOMAIN) {
    return new Response('错误: 源域名和目标域名不能为空', { status: 500 });
  }

  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  let url = new URL(request.url);
  let response;

  // ===== 特殊路径处理 =====
  // 处理robots.txt请求
  if (url.pathname === '/robots.txt') {
    return new Response('Sitemap: https://' + config.SOURCE_DOMAIN + '/sitemap.xml');
  }

  // 处理sitemap.xml请求
  if (url.pathname === '/sitemap.xml') {
    try {
      // 尝试获取目标网站的站点地图
      const targetSitemapUrl = 'https://' + config.TARGET_DOMAIN + '/sitemap.xml';
      const targetSitemapResponse = await fetch(targetSitemapUrl);
      
      if (targetSitemapResponse.ok) {
        // 如果成功获取到目标站点地图，替换域名后返回
        let sitemapContent = await targetSitemapResponse.text();
        
        // 全面替换所有URL格式
        sitemapContent = sitemapContent.replace(new RegExp(`https?://${config.TARGET_DOMAIN}`, 'g'), `https://${config.SOURCE_DOMAIN}`);
        sitemapContent = sitemapContent.replace(new RegExp(`//${config.TARGET_DOMAIN}`, 'g'), `//${config.SOURCE_DOMAIN}`);
        sitemapContent = sitemapContent.replace(new RegExp(`>${config.TARGET_DOMAIN}`, 'g'), `>${config.SOURCE_DOMAIN}`);
        sitemapContent = sitemapContent.replace(new RegExp(`"${config.TARGET_DOMAIN}`, 'g'), `"${config.SOURCE_DOMAIN}`);
        sitemapContent = sitemapContent.replace(new RegExp(`'${config.TARGET_DOMAIN}`, 'g'), `'${config.SOURCE_DOMAIN}`);
        
        response = new Response(sitemapContent);
        response.headers.set('content-type', 'application/xml');
        return response;
      } else {
        // 如果获取失败，生成基本站点地图
        return generateSitemapResponse(config.SOURCE_DOMAIN);
      }
    } catch (e) {
      // 出错时生成基本站点地图
      return generateSitemapResponse(config.SOURCE_DOMAIN);
    }
  }

  // ===== 构建目标URL并处理不同类型的请求 =====
  let targetUrl = new URL(url.pathname, 'https://' + config.TARGET_DOMAIN);
  targetUrl.search = url.search;

  // 处理JavaScript文件请求
  if (url.pathname.endsWith('.js')) {
    response = await fetch(targetUrl.toString());
    let body = await response.text();
    body = body.replace(new RegExp(config.TARGET_DOMAIN, 'g'), config.SOURCE_DOMAIN);
    response = new Response(body, response);
    response.headers.set('Content-Type', 'application/javascript');
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    return response;
  }

  // 处理CSS文件请求
  else if (url.pathname.endsWith('.css')) {
    response = await fetch(targetUrl.toString());
    let body = await response.text();
    body = body.replace(new RegExp(config.TARGET_DOMAIN, 'g'), config.SOURCE_DOMAIN);
    response = new Response(body, response);
    response.headers.set('Content-Type', 'text/css');
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    return response;
  }

  // 处理API请求
  else if (url.pathname.startsWith('/api')) {
    response = await fetch(targetUrl.toString(), {
      body: request.body,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
      },
      method: request.method,
    });
    response = new Response(response.body, response);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  }

  // 处理其他类型的请求
  else {
    try {
      const headers = new Headers(request.headers);
      headers.set('Referer', 'https://' + config.SOURCE_DOMAIN + '/');
      headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15');
      
      response = await fetch(targetUrl.toString(), {
        body: request.body,
        headers: headers,
        method: request.method,
        redirect: 'manual'
      });
      
      // 处理重定向响应
      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location');
        let newLocation;
        
        if (location.startsWith('http')) {
          newLocation = location.replace(new RegExp(config.TARGET_DOMAIN, 'g'), config.SOURCE_DOMAIN);
        } else if (location.startsWith('/')) {
          newLocation = 'https://' + config.SOURCE_DOMAIN + location;
        } else {
          newLocation = 'https://' + config.SOURCE_DOMAIN + '/' + location;
        }
        
        // 使用301状态码进行永久重定向
        return Response.redirect(newLocation, 301);
      }
      
      // 修改响应内容，替换域名 - 改进后的URL替换逻辑
      const originalBody = await response.text();
      let modifiedBody = originalBody;
      
      // 使用与sitemap.xml处理类似的全面URL替换逻辑
      // 确保不会添加任何反引号
      modifiedBody = modifiedBody.replace(new RegExp(`https?://${config.TARGET_DOMAIN}`, 'g'), `https://${config.SOURCE_DOMAIN}`);
      modifiedBody = modifiedBody.replace(new RegExp(`//${config.TARGET_DOMAIN}`, 'g'), `//${config.SOURCE_DOMAIN}`);
      modifiedBody = modifiedBody.replace(new RegExp(`>${config.TARGET_DOMAIN}`, 'g'), `>${config.SOURCE_DOMAIN}`);
      modifiedBody = modifiedBody.replace(new RegExp(`"${config.TARGET_DOMAIN}`, 'g'), `"${config.SOURCE_DOMAIN}`);
      modifiedBody = modifiedBody.replace(new RegExp(`'${config.TARGET_DOMAIN}`, 'g'), `'${config.SOURCE_DOMAIN}`);
      
      // ===== 全新的反引号清理逻辑 =====
      // 1. 清理双引号内的反引号（处理有空格和无空格的情况）
      modifiedBody = modifiedBody.replace(/"\s*`\s*([^`]+?)\s*`\s*"/g, '"$1"');
      // 2. 清理单引号内的反引号（处理有空格和无空格的情况）
      modifiedBody = modifiedBody.replace(/'\s*`\s*([^`]+?)\s*`\s*'/g, "'$1'");
      // 3. 清理没有引号包裹的属性值中的反引号
      modifiedBody = modifiedBody.replace(/=\s*`\s*([^`]+?)\s*`\s*>/g, '="$1">');
      // 4. 特别处理style属性中的反引号
      modifiedBody = modifiedBody.replace(/style=\s*"([^"`]*?)`([^`]+)`([^"`]*?)"/g, 'style="$1$2$3"');
      // 5. 额外处理任何位置的反引号包裹的URL（常见属性）
      modifiedBody = modifiedBody.replace(/(href|src|action|content|url)=\s*`\s*([^`]+?)\s*`/g, '$1="$2"');
      // 6. 处理OG元标签中的反引号（Open Graph协议）
      modifiedBody = modifiedBody.replace(/property="(og:[^>]*?)"\s*content=\s*`\s*([^`]+?)\s*`/g, 'property="$1" content="$2"');
      // 7. 处理rel属性中的反引号
      modifiedBody = modifiedBody.replace(/rel=\s*`\s*([^`]+?)\s*`/g, 'rel="$1"');
      // 8. 处理class属性中的反引号
      modifiedBody = modifiedBody.replace(/class=\s*`\s*([^`]+?)\s*`/g, 'class="$1"');
      // 9. 处理id属性中的反引号
      modifiedBody = modifiedBody.replace(/id=\s*`\s*([^`]+?)\s*`/g, 'id="$1"');
      // 10. 终极清理：处理任何残留的反引号包裹内容
      modifiedBody = modifiedBody.replace(/`\s*([^`]+?)\s*`/g, '$1');
      response = new Response(modifiedBody, { status: response.status, statusText: response.statusText, headers: response.headers });
      
      // ===== 安全头设置 =====
      // 修复CSP配置，使用正确的语法格式
      if (!response.headers.has('Content-Security-Policy')) {
        // 修复后的CSP配置，移除了反引号和多余的分号
        // 并扩展了img-src以支持更多图片源
        response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'self';");
      }
      
      // 添加其他安全相关的HTTP头
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      
      // 删除可能导致问题的头
      response.headers.delete('Location');
      response.headers.delete('Link');
      
      // 设置缓存策略
      response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=3600');
      
      // 确保内容类型正确设置
      if (!response.headers.has('Content-Type')) {
        response.headers.set('Content-Type', 'text/html; charset=utf-8');
      }
    } catch (e) {
      console.error('代理请求错误:', e);
      throw e;
    }
  }

  // 使用HTMLRewriter处理响应
  return new HTMLRewriter()
    .on('meta', new MetaRewriter())
    .on('head', new HeadRewriter())
    .on('body', new BodyRewriter(config))
    .transform(response);
}

// ========== 主入口 ==========
export default {
  async fetch(request, env, ctx) {
    return await fetchAndApply(request, env);
  }
};