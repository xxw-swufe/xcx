import re
import urllib.parse

def extract_links(text):
    print(f"\n--- 原始文本 ---\n{text}\n")
    
    links = []
    
    # 策略 1: 专门捕捉以特定后缀结尾的 URL (针对用户提到的 .pdf, .docx 等)
    # 这个正则会从 http 开始，尽可能多地匹配非空白字符，直到匹配到指定的后缀名
    # [^\s]+? 是非贪婪匹配非空白字符
    # (?:\.pdf|\.docx|\.doc|\.xls|\.xlsx) 是匹配后缀
    # (?:\?[^\s]*)? 是匹配可能存在的查询参数
    suffix_pattern = r'(https?://[^\s]+?\.(?:pdf|docx|doc|xls|xlsx|ppt|pptx|zip|rar|txt|png|jpg|jpeg)(?:\?[^\s]*)?)'
    
    # 策略 2: 传统的 Markdown 链接匹配 [标题](链接)
    # 修正版：内部链接使用非贪婪匹配，但要处理平衡括号问题比较复杂，
    # 这里我们先用最宽泛的匹配，然后再通过后缀逻辑修正
    markdown_pattern = r'\[([^\]]+)\]\((https?://[^\s)]+(?:\([^\s)]*\)[^\s)]*)*)\)'

    # 1. 先找 Markdown 链接
    matches = re.finditer(markdown_pattern, text)
    for match in matches:
        label = match.group(1)
        url = match.group(2)
        links.append({"label": label, "url": url, "source": "markdown"})
        # 在文本中屏蔽已找到的链接，防止重复
        text = text.replace(match.group(0), " [ALREADY_EXTRACTED] ")

    # 2. 再找剩下的纯文本链接 (使用后缀驱动或空格驱动)
    # 这种方式最保险，只要有 http 且包含后缀，就一定能抓全
    matches = re.finditer(suffix_pattern, text)
    for match in matches:
        url = match.group(1)
        # 简单处理：如果末尾有中文标点，去掉
        url = re.sub(r'[，。；！!？?,]+$', '', url)
        
        # 尝试从 URL 中提取文件名作为 label
        path = urllib.parse.unquote(url.split('?')[0].split('/')[-1])
        links.append({"label": path or "文件链接", "url": url, "source": "text_suffix"})

    return links

if __name__ == "__main__":
    # 测试用例：用户提供的那个包含 (22).pdf 的复杂 IP 链接
    test_text = """
pdf_download_url : "http://47.108.142.194:3000/uploads/关于佛山市高明区明城220kV输变电工程架空线路与珠三角成品油管道交叉保护方案意见的复函(24).pdf
word_download_url : "http://47.108.142.194:3000/uploads/关于佛山市高明区明城220kV输变电工程架空线路与珠三角成品油管道交叉保护方案意见的复函(24).docx
    """
    
    extracted = extract_links(test_text)
    
    print("--- 提取结果 ---")
    if not extracted:
        print("未找到任何链接")
    for i, link in enumerate(extracted, 1):
        print(f"[{i}] 类型: {link['source']}")
        print(f"    标题: {link['label']}")
        print(f"    链接: {link['url']}")
        print("-" * 20)
