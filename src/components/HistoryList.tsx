import React, { useEffect, useMemo, useState } from 'react';
import { List, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import VirtualList from 'rc-virtual-list';
import { Conversation } from '../DTOs/Conversation.dto';

interface HistoryListProps {
    conversations: Conversation[];
    onDelete: (conversationTime: number) => void; // 删除对话的回调（使用 createTime）
    onSelect: (conversation: Conversation) => void; // 选择对话的回调
    expanded:boolean
}

const CONTAINER_HEIGHT = 400;

const HistoryList: React.FC<HistoryListProps> = ({ conversations, onDelete, onSelect,expanded }) => {
    // 源数据
    const [allConversations, setAllConversations] = useState<Conversation[]>(conversations);
    // 悬停状态
    const [hoveredItemKey, setHoveredItemKey] = useState<string | number | null>(null);
    const [hoveredDeleteKey, setHoveredDeleteKey] = useState<string | number | null>(null);

    // 外部变更同步
    useEffect(() => {
        setAllConversations(conversations);
    }, [conversations]);

    // 统一在组件内再确保一次排序（按 lastUpdateTime 降序）
    const sortedConversations = useMemo(
        () => [...allConversations].sort((a, b) => (b.lastUpdateTime ?? 0) - (a.lastUpdateTime ?? 0)),
        [allConversations]
    );

    const handleDelete = (createTime: number) => {
        onDelete(createTime);
        console.log(`Conversation with createTime ${createTime} deleted from store.`);
    };

    const handleSelect = (conversation: Conversation) => {
        onSelect(conversation);
        console.log(`Selected conversation: ${conversation.title}`);
    };

    const itemStyle: React.CSSProperties = {
        padding: '12px 16px',
        borderBlockEnd: '1px solid rgba(5, 5, 5, 0.06)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    return (
        <div style={{width:expanded?"376px":"375px"}}>
            <VirtualList
                data={sortedConversations}
                height={CONTAINER_HEIGHT}
                itemHeight={50}
                // 用 createTime 作为唯一 key，避免 lastUpdateTime 相同导致的重复 key 问题
                itemKey="createTime"
            >
                {(item: Conversation) => (
                    <List.Item
                        key={item.createTime}
                        style={itemStyle}
                        onMouseEnter={() => setHoveredItemKey(item.createTime)}
                        onMouseLeave={() => setHoveredItemKey(null)}
                        onClick={() => handleSelect(item)}
                    >
                        <Typography.Text ellipsis={true} style={{ flex: 1, marginRight: '16px' }}>
                            {item.title}
                        </Typography.Text>

                        {hoveredItemKey === item.createTime && (
                            <DeleteOutlined
                                style={{
                                    color: hoveredDeleteKey === item.createTime ? '#ff7875' : 'red',
                                    fontSize: '16px',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    backgroundColor: hoveredDeleteKey === item.createTime ? 'rgba(255, 77, 79, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    transform: hoveredDeleteKey === item.createTime ? 'scale(1.1)' : 'scale(1)',
                                }}
                                onMouseEnter={() => setHoveredDeleteKey(item.createTime)}
                                onMouseLeave={() => setHoveredDeleteKey(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.createTime);
                                }}
                            />
                        )}
                    </List.Item>
                )}
            </VirtualList>
        </div>
    );
};

export default HistoryList;
