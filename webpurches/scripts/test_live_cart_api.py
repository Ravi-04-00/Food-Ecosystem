import requests

BASE_URL = 'http://localhost:8000/api'

# 1. Login
login_res = requests.post(f'{BASE_URL}/auth/login/', json={
    'email': 'customer@wsfood.io',
    'password': 'wsfood123'
})
print("Login status:", login_res.status_code)
tokens = login_res.json()
token = tokens.get('access') or tokens.get('access_token')
print("Access token acquired:", bool(token))
headers = {'Authorization': f'Bearer {token}'}

# 2. Get Restaurant 1 details
rest_res = requests.get(f'{BASE_URL}/products/restaurants/1/', headers=headers)
print("Restaurant 1 status code:", rest_res.status_code)
if rest_res.ok:
    rdata = rest_res.json()
    print("Restaurant Name:", rdata.get('name'))
    print("Restaurant Status:", rdata.get('status'))
    print("Restaurant is_currently_open:", rdata.get('is_currently_open'))
    print("Restaurant closure_reason:", rdata.get('closure_reason'))

# 3. Add to Cart: Food 1 (Quantum Double Glaze Burger from CYBER SMASH BURGERS 2099)
cart_res = requests.post(f'{BASE_URL}/cart/items/', json={
    'food_id': 1,
    'quantity': 2,
    'clear_cart': True
}, headers=headers)
print("Add to cart status code:", cart_res.status_code)
print("Add to cart response success:", cart_res.json().get('success'))
print("Add to cart message:", cart_res.json().get('message'))

# 4. Fetch Cart
get_cart = requests.get(f'{BASE_URL}/cart/', headers=headers)
print("Get cart status code:", get_cart.status_code)
if get_cart.ok:
    cdata = get_cart.json()
    print("Cart Items count:", len(cdata.get('items', [])))
    print("Cart Subtotal:", cdata.get('subtotal'))
    print("Cart Restaurant:", cdata.get('restaurant', {}).get('name'))
