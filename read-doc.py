import olefile
import struct

def read_doc_text(filepath):
    ole = olefile.OleFileIO(filepath)
    word_stream = ole.openstream('WordDocument')
    data = word_stream.read()
    
    # 提取FIB信息
    # FIB (File Information Block) 开头的一些标志
    # 查找文本的位置比较复杂，让我们用另一种方法
    
    # 尝试读取 1Table 或 0Table
    table_name = '1Table' if ole.exists('1Table') else '0Table'
    table_stream = ole.openstream(table_name)
    table_data = table_stream.read()
    
    # 简单方法：从WordDocument中提取所有可读的Unicode文本
    text_parts = []
    i = 0
    while i < len(data) - 1:
        # 尝试读取Unicode字符
        if data[i] != 0 or data[i+1] != 0:
            try:
                char = data[i:i+2].decode('utf-16-le', errors='ignore')
                if char and char.isprintable():
                    text_parts.append(char)
            except:
                pass
        i += 2
    
    full_text = ''.join(text_parts)
    # 清理一下
    lines = [line.strip() for line in full_text.split('\r') if line.strip()]
    return '\n'.join(lines)

if __name__ == '__main__':
    text = read_doc_text('/workspace/国家级教师创新团队成员考核方案(2)(1).doc')
    print(text)
