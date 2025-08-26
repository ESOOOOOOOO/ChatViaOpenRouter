import { message } from 'antd';


export const onCopy = (textToCopy: string) => {
if (!textToCopy) return message.success('Text is empty');
message.success('Text copied successfully');
navigator.clipboard.writeText(textToCopy);
};