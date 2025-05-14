import request from '@/utils/request'

export function searchProducts(params) {
  return request({
    url: '/api/products/search',
    method: 'get',
    params
  })
} 