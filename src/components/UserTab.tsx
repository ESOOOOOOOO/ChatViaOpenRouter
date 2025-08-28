import React from 'react';
import { Avatar, Button, Input, Select, Space, Typography, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { PAGE_HEIGHT } from './../constants/settings';
import { languageOptions } from './../constants/languageOptions';
import type { UserInfo } from '../DTOs/systemLanguage.dto';

type UserTabProps = {
  userInfo: UserInfo;
  draftName: string;
  setDraftName: (v: string) => void;
  hasAvatar: boolean;
  isUserDirty: boolean;
  savingUser: boolean;
  onChangeSystemLanguage: (value: any) => void;
  onSaveUser: () => Promise<void> | void;
  onSaveAvatar: (dataUrl: string) => Promise<void>;
};

const UserTab: React.FC<UserTabProps> = ({
  userInfo, draftName, setDraftName, hasAvatar, isUserDirty, savingUser,
  onChangeSystemLanguage, onSaveUser, onSaveAvatar,
}) => {
  const commonPageStyle: React.CSSProperties = {
    height: PAGE_HEIGHT,
    overflowY: 'auto',
    paddingRight: 16,
  };

  const uploadProps: UploadProps = {
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: async (file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataURL = String(reader.result || '');
        await onSaveAvatar(dataURL);
        message.success('Avatar Updated');
      };
      reader.onerror = () => message.error('Failed to load image');
      reader.readAsDataURL(file);
      return false;
    },
  };

  return (
    <div style={{ ...commonPageStyle, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={80}
              src={hasAvatar ? userInfo.avatar : undefined}
              icon={hasAvatar ? undefined : <UserOutlined />}
            />
            <div style={{ marginTop: 12 }}>
              <Upload {...uploadProps}>
                <Button>{hasAvatar ? userInfo.language.updateAvatar : userInfo.language.setAvatar}</Button>
              </Upload>
            </div>
          </div>

          <div>
            <Typography.Text strong>{userInfo.language.getName}</Typography.Text>
            <Input
              placeholder={userInfo.language.usernamePlaceHolder}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              allowClear
            />
          </div>

          <div>
            <Typography.Text strong>{userInfo.language.languagePreference}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Select
                placeholder={userInfo.language.languagePreference}
                value={userInfo.language || undefined}
                onChange={onChangeSystemLanguage}
                style={{ width: '100%' }}
                options={languageOptions}
                showSearch={false}
                allowClear={false}
                optionFilterProp="label"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" onClick={onSaveUser} loading={savingUser} disabled={!isUserDirty || savingUser}>
              {userInfo.language.save}
            </Button>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default UserTab;
