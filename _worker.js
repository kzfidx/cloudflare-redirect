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
  
  /* Step 5: enter any custom scripts you'd like */
  const CUSTOM_SCRIPT = GA_ID ? 
  `<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GA_ID}');
</script>` : '';
  
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
    
    /* 根据GA_ID生成自定义脚本 */
    const CUSTOM_SCRIPT = GA_ID ? 
    `<!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  
    gtag('config', '${GA_ID}');
  </script>` : '';
  
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    let url = new URL(request.url);
    
    if (url.pathname === '/robots.txt') {
      return new Response('Sitemap: https://' + SOURCE_DOMAIN + '/sitemap.xml');
    }
    if (url.pathname === '/sitemap.xml') {
      let response = new Response(generateSitemap());
      response.headers.set('content-type', 'application/xml');
      return response;
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
          
          return Response.redirect(newLocation, response.status);
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

    return appendModifications(response);
  }
  
  class HeadRewriter {
    element(element) {
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
        </script>${CUSTOM_SCRIPT}`, {
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