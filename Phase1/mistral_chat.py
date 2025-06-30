
import ollama

def chat_bot(prompt):
    response = ollama.chat(
        model='mistral',
        messages=[
            {'role': 'system', 'content': 'Bạn là một AI biết nói tiếng Việt.'},
            {'role': 'user', 'content': prompt}
        ]
    )
    print(response['message']['role'])
    return response['message']['content']


if __name__ == "__main__":
    print("Chat với Mistral (qua Ollama)")
    print("Gõ 'exit' để thoát.\n")

    while True:
        user_input = input("Bạn: ")
        if user_input.lower().strip() in ['exit', 'quit']:
            print("END")
            break

        answer = chat_bot(user_input)
        print("Bot:", answer)
        print("-" * 50)
