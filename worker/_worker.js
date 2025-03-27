/* CONFIGURATION STARTS HERE */
  
  /* Step 1: enter your source domain */
  const SOURCE_DOMAIN = '';
  
  /* Step 2: enter your target domain */
  const TARGET_DOMAIN = '';
  
  /* Step 3: enter your page title and description for SEO purposes */
  const PAGE_TITLE = '';
  const PAGE_DESCRIPTION = '';
  
  /* Step 4: enter your Google Analytics ID (留空则不添加GA) */
  const GA_ID = '';
  
  /* Step 5: enter your Google Adsense ID (留空则不添加Adsense) */
  const ADSENSE_ID = '';
  
  /* Step 6: enter any custom scripts you'd like */
  const CUSTOM_SCRIPT = GA_ID ? 
  `<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>` : '';
  
  const ADSENSE_SCRIPT = ADSENSE_ID ? 
  `<!-- Google Adsense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script>` : '';
  
  /* CONFIGURATION ENDS HERE */
  
  export default {
    async fetch(request, env, ctx) {
      return await fetchAndApply(request, env);
    }
  };
  
  async function fetchAndApply(request, env) {
    /* 从环境变量读取配置，如果不存在则使用默认值 */
    const SOURCE_DOMAIN = env && env.SOURCE_DOMAIN ? env.SOURCE_DOMAIN : '';
    const TARGET_DOMAIN = env && env.TARGET_DOMAIN ? env.TARGET_DOMAIN : '';
    const PAGE_TITLE = env && env.PAGE_TITLE ? env.PAGE_TITLE : '';
    const PAGE_DESCRIPTION = env && env.PAGE_DESCRIPTION ? env.PAGE_DESCRIPTION : '';
    const GA_ID = env && env.GA_ID ? env.GA_ID : '';
    const ADSENSE_ID = env && env.ADSENSE_ID ? env.ADSENSE_ID : '';
    
    /* 根据GA_ID和ADSENSE_ID生成自定义脚本 */
    const CUSTOM_SCRIPT = GA_ID ? 
    `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  
    gtag('config', '${GA_ID}');
  </script>` : '';
  
    const ADSENSE_SCRIPT = ADSENSE_ID ? 
    `<!-- Google Adsense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script>` : '';
  
    // 添加一个选项，允许设置是否使用301永久重定向
    const USE_PERMANENT_REDIRECT = env && env.USE_PERMANENT_REDIRECT ? env.USE_PERMANENT_REDIRECT === 'true' : true;
    
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    let url = new URL(request.url);
    
    // 添加一个选项，允许设置是否使用301永久重定向
    const USE_PERMANENT_REDIRECT = env && env.USE_PERMANENT_REDIRECT ? env.USE_PERMANENT_REDIRECT === 'true' : true;
    
    // 移除这行代码，因为response还未定义
    // if (USE_PERMANENT_REDIRECT) {
    //   response.headers.set('X-Redirect-Type', 'Permanent (301)');
    // }
    
    if (url.pathname === '/robots.txt') {
      return new Response('Sitemap: https://' + SOURCE_DOMAIN + '/sitemap.xml');
    }
    if (url.pathname === '/sitemap.xml') {
      try {
        // 尝试获取目标网站的站点地图
        const targetSitemapUrl = 'https://' + TARGET_DOMAIN + '/sitemap.xml';
        const targetSitemapResponse = await fetch(targetSitemapUrl);
        
        if (targetSitemapResponse.ok) {
          // 如果成功获取到目标站点地图，替换域名后返回
          let sitemapContent = await targetSitemapResponse.text();
          
          // 更全面的替换，确保所有URL都被替换
          // 替换完整的URL（包含http/https协议）
          sitemapContent = sitemapContent.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), `https://${SOURCE_DOMAIN}`);
          
          // 替换不带协议的URL
          sitemapContent = sitemapContent.replace(new RegExp(`//${TARGET_DOMAIN}`, 'g'), `//${SOURCE_DOMAIN}`);
          
          // 替换可能存在的其他形式的URL
          sitemapContent = sitemapContent.replace(new RegExp(`>${TARGET_DOMAIN}`, 'g'), `>${SOURCE_DOMAIN}`);
          sitemapContent = sitemapContent.replace(new RegExp(`"${TARGET_DOMAIN}`, 'g'), `"${SOURCE_DOMAIN}`);
          sitemapContent = sitemapContent.replace(new RegExp(`'${TARGET_DOMAIN}`, 'g'), `'${SOURCE_DOMAIN}`);
          
          let response = new Response(sitemapContent);
          response.headers.set('content-type', 'application/xml');
          return response;
        } else {
          // 如果获取失败，生成基本站点地图
          let response = new Response(generateSitemap(SOURCE_DOMAIN));
          response.headers.set('content-type', 'application/xml');
          return response;
        }
      } catch (e) {
        // 出错时生成基本站点地图
        let response = new Response(generateSitemap(SOURCE_DOMAIN));
        response.headers.set('content-type', 'application/xml');
        return response;
      }
    }
    
    let targetUrl = new URL(url.pathname, 'https://' + TARGET_DOMAIN);
    targetUrl.search = url.search;
    
    let response;
    
    if (url.pathname.endsWith('.js')) {
      response = await fetch(targetUrl.toString());
      let body = await response.text();
      body = body.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
      response = new Response(body, response);
      response.headers.set('Content-Type', 'application/javascript');
      return response;
    } 
    else if (url.pathname.endsWith('.css')) {
      response = await fetch(targetUrl.toString());
      let body = await response.text();
      body = body.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
      response = new Response(body, response);
      response.headers.set('Content-Type', 'text/css');
      return response;
    }
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
      return response;
    } 
    else {
      try {
        const headers = new Headers(request.headers);
        headers.set('Referer', 'https://' + SOURCE_DOMAIN + '/');
        headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15');
        
        response = await fetch(targetUrl.toString(), {
          body: request.body,
          headers: headers,
          method: request.method,
          redirect: 'manual'
        });
        
        if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
          const location = response.headers.get('location');
          let newLocation;
          
          if (location.startsWith('http')) {
            newLocation = location.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
          } else if (location.startsWith('/')) {
            newLocation = 'https://' + SOURCE_DOMAIN + location;
          } else {
            newLocation = 'https://' + SOURCE_DOMAIN + '/' + location;
          }
          
          // 使用301状态码进行永久重定向，而不是保留原始状态码
          return Response.redirect(newLocation, 301);
        }
        
        const originalBody = await response.text();
        let modifiedBody = originalBody.replace(new RegExp(TARGET_DOMAIN, 'g'), SOURCE_DOMAIN);
        
        response = new Response(modifiedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        
        response.headers.delete('Content-Security-Policy');
        response.headers.delete('X-Content-Security-Policy');
        response.headers.delete('Location');
        response.headers.delete('Link');
        
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        
        if (!response.headers.has('Content-Type')) {
          response.headers.set('Content-Type', 'text/html; charset=utf-8');
        }
      } catch (e) {
        return new Response(`代理请求错误: ${e.message}`, { status: 500 });
      }
    }

    // 如果启用了永久重定向，为响应添加301状态码标记
    if (USE_PERMANENT_REDIRECT && response && response.headers) {
      response.headers.set('X-Redirect-Type', 'Permanent (301)');
    }

    return appendModifications(response);
  }
  
  class HeadRewriter {
    element(element) {
      // 将Google Analytics代码添加到head标签的开头，确保它尽早加载
      if (GA_ID) {
        element.prepend(CUSTOM_SCRIPT, {
          html: true
        });
      }
      
      element.prepend(`<script>
        document.addEventListener('DOMContentLoaded', function() {
          const baseElements = document.querySelectorAll('base');
          baseElements.forEach(el => el.remove());
        });
      </script>`, {
        html: true
      });
      
      element.append(`<style>
      /* 在这里添加自定义CSS样式 */
      </style>`, {
        html: true
      });
      
      element.append(`<base href="https://${SOURCE_DOMAIN}/">`, {
        html: true
      });
    }
  }
  
  class MetaRewriter {
    element(element) {
      if (PAGE_TITLE !== '') {
        if (element.getAttribute('property') === 'og:title'
          || element.getAttribute('name') === 'twitter:title') {
          element.setAttribute('content', PAGE_TITLE);
        }
        if (element.tagName === 'title') {
          element.setInnerContent(PAGE_TITLE);
        }
      }
      if (PAGE_DESCRIPTION !== '') {
        if (element.getAttribute('name') === 'description'
          || element.getAttribute('property') === 'og:description'
          || element.getAttribute('name') === 'twitter:description') {
          element.setAttribute('content', PAGE_DESCRIPTION);
        }
      }
      if (element.getAttribute('property') === 'og:url'
        || element.getAttribute('name') === 'twitter:url') {
        element.setAttribute('content', 'https://' + SOURCE_DOMAIN);
      }
    }
  }

  class BodyRewriter {
    element(element) {
        element.append(`<div style="display:none">Powered by Cloudflare Workers</div>
        <script>
        (function() {
            try {
                function fixLinks() {
                    try {
                        const links = document.querySelectorAll('a');
                        links.forEach(link => {
                            if (link.href) {
                                // 添加调试信息
                                console.log('Processing link:', link.href);
                                
                                if (link.href.includes('${TARGET_DOMAIN}')) {
                                    link.href = link.href.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                                }
                                // 改进mailto链接处理
                                if (link.href.includes('/cdn-cgi/l/email-protection')) {
                                    try {
                                        const decodedEmail = decodeEmail(link.href);
                                        console.log('Decoded email:', decodedEmail);
                                        // 确保添加mailto:前缀
                                        link.href = 'mailto:' + decodedEmail;
                                        // 显示文本改为"Email"
                                        link.textContent = 'Email';
                                        // 添加email样式
                                        link.classList.add('email-link');
                                        // 添加title提示
                                        link.title = '发送邮件至 ' + decodedEmail;
                                    } catch (e) {
                                        console.error('Email decode error:', e);
                                    }
                                }
                            }
                        });
                        
                        const updateSrcAttributes = (elements, attribute) => {
                            elements.forEach(el => {
                                const src = el.getAttribute(attribute);
                                if (src && src.includes('${TARGET_DOMAIN}')) {
                                    el.setAttribute(attribute, src.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}'));
                                }
                            });
                        };
                        
                        updateSrcAttributes(document.querySelectorAll('img'), 'src');
                        updateSrcAttributes(document.querySelectorAll('script'), 'src');
                        updateSrcAttributes(document.querySelectorAll('link'), 'href');
                        updateSrcAttributes(document.querySelectorAll('form'), 'action');
                        
                        const metaTags = document.querySelectorAll('meta[content]');
                        metaTags.forEach(meta => {
                            const content = meta.getAttribute('content');
                            if (content && content.includes('${TARGET_DOMAIN}')) {
                                meta.setAttribute('content', content.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}'));
                            }
                        });
                        
                        if (window.location.href.includes('${TARGET_DOMAIN}')) {
                            const newUrl = window.location.href.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    } catch (e) {
                        console.error('Error in fixLinks:', e);
                    }
                }
                
                // 改进邮件解码函数
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
                
                // 立即执行并设置定时器定期检查
                fixLinks();
                setInterval(fixLinks, 1000);
                
                const observer = new MutationObserver(function() {
                    fixLinks();
                });
                
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
                
                const originalAssign = window.location.assign;
                window.location.assign = function(url) {
                    if (url.includes('${TARGET_DOMAIN}')) {
                        url = url.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                    }
                    return originalAssign.call(window.location, url);
                };
                
                const originalReplace = window.location.replace;
                window.location.replace = function(url) {
                    if (url.includes('${TARGET_DOMAIN}')) {
                        url = url.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                    }
                    return originalReplace.call(window.location, url);
                };
                
                const originalPushState = history.pushState;
                history.pushState = function() {
                    if (arguments[2] && typeof arguments[2] === 'string') {
                        arguments[2] = arguments[2].replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                    }
                    return originalPushState.apply(this, arguments);
                };
                
                const originalReplaceState = history.replaceState;
                history.replaceState = function() {
                    if (arguments[2] && typeof arguments[2] === 'string') {
                        arguments[2] = arguments[2].replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                    }
                    return originalReplaceState.apply(this, arguments);
                };
                
                if (window.location.href.includes('${TARGET_DOMAIN}')) {
                    const newUrl = window.location.href.replace(new RegExp('${TARGET_DOMAIN}', 'g'), '${SOURCE_DOMAIN}');
                    window.history.replaceState({}, document.title, newUrl);
                }
            } catch (e) {
                console.error('Error in main script:', e);
            }
        })();
        </script>
        ${ADSENSE_SCRIPT}
        ${CUSTOM_SCRIPT}`, {
            html: true
        });
    }
  }
  
  async function appendModifications(res) {
    return new HTMLRewriter()
      .on('title', new MetaRewriter())
      .on('meta', new MetaRewriter())
      .on('head', new HeadRewriter())
      .on('body', new BodyRewriter())
      .transform(res);
  }

  // 生成基本站点地图
  function generateSitemap(domain) {
    const currentDate = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://${domain}/</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
  </urlset>`;
  }

  // 处理OPTIONS请求
  function handleOptions(request) {
    let headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      let respHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
      };
      return new Response(null, { headers: respHeaders });
    } else {
      return new Response(null, { headers: { Allow: "GET, HEAD, POST, OPTIONS" } });
    }
  }