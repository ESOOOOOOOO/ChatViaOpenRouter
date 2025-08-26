import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd'; // Import ThemeConfig for better type checking

import Maindock from "./MainDock";
import ChatDock from "./ChatDock";

// Define your theme configuration
const customTheme: ThemeConfig = {
  token: {
    colorPrimaryActive: '#000000',
    colorPrimary: '#e6b85c'
  },

  components: {
    Button: {
      colorPrimary: '#e6b85c',       // 主色：柔和金黄
      colorPrimaryHover: '#f0cd85',  // 悬停：稍浅的奶油金
      colorPrimaryActive: '#c79c4e'  // 点击：偏深的暖金
    },
    Popover: {
      titleMinWidth: 400,
    },
    Modal: {
      footerBg: "#f5f0ea",
      headerBg: "#f5f0ea",
      contentBg: "#f5f0ea"
    },
    Tabs:{
      itemColor:"#c79c4e",
      itemHoverColor:"#f0cd85",
      itemSelectedColor:"#e6b85c",
      itemActiveColor:"#e6b85c",
    }
  },

};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Maindock />,
  },
  {
    path: '/chat',
    element: <ChatDock />,
  }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider theme={customTheme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);