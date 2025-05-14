import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8080', // API的base_url
  timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加调试日志
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data
    })
    
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.log('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 添加调试日志
    console.log('收到响应:', response.data)
    const res = response.data
    return res
  },
  error => {
    console.log('响应错误:', error)
    console.log('错误详情:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    let message = error.message
    if (error.response && error.response.data) {
      message = error.response.data.message || error.response.data
    }
    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service 