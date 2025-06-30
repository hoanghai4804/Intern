import ollama

response = ollama.chat(
    model='mistral',
    messages=[
        {'role': 'system', 'content': 'Bạn là một AI biết nói tiếng Việt.'},
        {'role': 'user', 'content': 'Tóm tắt truyện Dế Mèn Phiêu Lưu Ký'}
    ]
)

print(response['message']['content'])
