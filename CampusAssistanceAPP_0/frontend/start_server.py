import os
import sys
import http.server
import socketserver
import webbrowser
import urllib.request
import urllib.error
import json
from urllib.parse import urlparse, parse_qs

print("=== 开始启动服务器 ===")
print(f"当前目录: {os.getcwd()}")
print(f"Python版本: {sys.version}")

# 确保工作在frontend目录
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
print(f"设置工作目录: {os.getcwd()}")

# 检查pages目录
if not os.path.exists('pages'):
    print("错误：找不到pages目录")
    print(f"当前目录内容: {os.listdir('.')}")
    input("按回车键退出...")
    sys.exit(1)

# 检查src/assets目录
if not os.path.exists('src/assets'):
    print("错误：找不到src/assets目录")
    print(f"src目录内容: {os.listdir('src')}")
    input("按回车键退出...")
    sys.exit(1)

# 创建表示HTML文件中资源路径的符号链接
os.makedirs('pages/src', exist_ok=True)
if not os.path.exists('pages/src/assets') and os.path.exists('src/assets'):
    try:
        if os.name == 'nt':  # Windows
            import subprocess
            subprocess.run(['mklink', '/J', 'pages\\src\\assets', '..\\src\\assets'], 
                          shell=True, check=True)
            print("已创建符号链接: pages/src/assets -> ../src/assets")
        else:  # Linux/Mac
            os.symlink('../../src/assets', 'pages/src/assets')
            print("已创建符号链接: pages/src/assets -> ../../src/assets")
    except Exception as e:
        print(f"创建符号链接失败: {str(e)}")
        print("将使用重定向处理资源路径")

# 自定义HTTP请求处理器
class EncodingFixedHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        print(f"收到请求: {self.path}")
        
        # 如果访问根目录或无扩展名的路径，重定向到相应页面
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/pages/index.html')
            self.end_headers()
            return
        
        # 如果直接访问HTML文件，重定向到pages目录
        elif self.path.endswith('.html') and not self.path.startswith('/pages/'):
            self.send_response(302)
            self.send_header('Location', f'/pages{self.path}')
            self.end_headers()
            return
        
        # 处理无扩展名的路径
        elif self.path in ['/login', '/index', '/profile', '/market', '/express', 
                          '/product-detail', '/my-products', '/publish-product', '/wanted-product']:
            self.send_response(302)
            self.send_header('Location', f'/pages{self.path}.html')
            self.end_headers()
            return
            
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def send_header(self, keyword, value):
        """重写send_header方法，确保HTML文件使用UTF-8编码"""
        if keyword.lower() == 'content-type' and value.startswith('text/html'):
            value = 'text/html; charset=utf-8'
        super().send_header(keyword, value)
    
    def end_headers(self):
        """添加缓存控制和CORS头"""
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

# 设置端口
PORT = 8000

# 创建HTTP服务器
Handler = EncodingFixedHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"服务器启动在 http://localhost:{PORT}")
print("按 Ctrl+C 停止服务器")

# 显示目录内容
print(f"当前目录内容: {os.listdir('.')}")
print(f"pages目录内容: {os.listdir('pages')}")
print(f"src/assets目录内容: {os.listdir('src/assets')}")

# 自动打开浏览器
webbrowser.open(f'http://localhost:{PORT}/pages/index.html')

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n服务器已停止")
except Exception as e:
    print(f"\n发生错误: {str(e)}")
finally:
    input("\n按回车键退出...")

class ProxyRequestHandler(http.server.SimpleHTTPRequestHandler):
    # 创建目录路径映射表
    # 将/src/assets/映射到实际的前端目录结构
    path_map = {
        '/src/assets/': '/src/assets/'
    }

    def do_GET(self):
        # 如果是API请求，转发到后端
        if self.path.startswith('/api/'):
            self.proxy_request('GET')
        else:
            # 处理静态文件
            self.handle_static_files()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_request('POST')
        else:
            self.send_error(404, "Not Found")

    def do_PUT(self):
        if self.path.startswith('/api/'):
            self.proxy_request('PUT')
        else:
            self.send_error(404, "Not Found")

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            self.proxy_request('DELETE')
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        if self.path.startswith('/api/'):
            # 处理预检请求
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            self.send_header('Access-Control-Max-Age', '86400')  # 24小时
            self.end_headers()
        else:
            self.send_error(404, "Not Found")

    def proxy_request(self, method):
        # 将请求转发到后端服务器
        backend_url = f"http://localhost:8080{self.path}"
        print(f"转发{method}请求到: {backend_url}")
        
        try:
            # 读取请求体（如果有）
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            # 准备请求头
            headers = {}
            for key, value in self.headers.items():
                # 跳过一些特殊的头部
                if key.lower() not in ['host', 'content-length']:
                    headers[key] = value
            
            # 创建请求
            req = urllib.request.Request(
                backend_url, 
                data=body,
                headers=headers, 
                method=method
            )
            
            # 发送请求到后端
            with urllib.request.urlopen(req) as response:
                # 设置响应状态码
                self.send_response(response.status)
                
                # 设置响应头
                for key, val in response.getheaders():
                    if key.lower() not in ['transfer-encoding', 'content-encoding']:
                        self.send_header(key, val)
                
                # 添加CORS头
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # 发送响应体
                self.wfile.write(response.read())
                
        except urllib.error.HTTPError as e:
            # 转发HTTP错误
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # 尝试读取和转发错误消息
            try:
                error_body = e.read()
                self.wfile.write(error_body)
            except:
                error_msg = json.dumps({"error": str(e)})
                self.wfile.write(error_msg.encode('utf-8'))
                
        except Exception as e:
            # 处理其他异常
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_msg = json.dumps({"error": f"代理请求错误: {str(e)}"})
            self.wfile.write(error_msg.encode('utf-8'))

    def handle_static_files(self):
        # 重定向到首页
        if self.path == '/':
            self.path = '/pages/index.html'
        
        # 处理/pages/路径下的文件
        if self.path.startswith('/pages/'):
            requested_file = os.path.join(os.getcwd(), self.path[1:])
            if os.path.exists(requested_file) and os.path.isfile(requested_file):
                print(f"收到请求: {self.path}")
                super().do_GET()
                return
        
        # 处理其他静态资源
        print(f"收到请求: {self.path}")
        # 检查重定向逻辑
        for prefix, mapped_prefix in self.path_map.items():
            if self.path.startswith(prefix):
                # 使用默认处理方式
                super().do_GET()
                return
        
        # 找不到文件，返回404
        self.send_error(404, "File not found")

# 设置当前工作目录
def setup_environment():
    print("=== 开始启动服务器 ===")
    print("当前目录:", os.getcwd())
    print("Python版本:", os.sys.version)
    
    # 设置工作目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print("设置工作目录:", script_dir)
    os.chdir(script_dir)
    
    # 创建符号链接，确保/pages/能访问到/src/assets/
    try:
        if not os.path.exists('pages/src'):
            os.makedirs('pages/src', exist_ok=True)
        if not os.path.exists('pages/src/assets'):
            if os.name == 'nt':  # Windows
                os.system(f'mklink /J pages\\src\\assets ..\\src\\assets')
            else:  # Linux/Mac
                os.system(f'ln -s ../../src/assets pages/src/assets')
    except Exception as e:
        print(f"创建符号链接失败: {str(e)}")
        print("将使用重定向处理资源路径")
    
    # 显示目录内容
    print("当前目录内容:", os.listdir('.'))
    if os.path.exists('pages'):
        print("pages目录内容:", os.listdir('pages'))
    if os.path.exists('src/assets'):
        print("src/assets目录内容:", os.listdir('src/assets'))

# 主函数
def main():
    setup_environment()
    
    # 创建服务器
    handler = ProxyRequestHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    
    print(f"服务器启动在 http://localhost:{PORT}")
    print("按 Ctrl+C 停止服务器")
    
    try:
        # 启动服务器
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.server_close()

if __name__ == "__main__":
    main() 