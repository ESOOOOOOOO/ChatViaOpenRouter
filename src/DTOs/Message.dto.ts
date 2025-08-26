export class Message {
    id!: number;
    content!: TypedData[];
    role!: 'user' | 'assistant' | 'system';
}

export class TypedData {
    // 移除 'textable'，统一走标准 'text'
    type!: 'text' | 'image_url' | 'file' | 'input_audio';
    text?: string;
    file?: {
        filename: string,
        file_data: string,
    }
    image_url?: {
        url: string
    }
    input_audio?: {
        data: string,
        format: string,
    }
}
