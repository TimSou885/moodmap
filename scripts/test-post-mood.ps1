# 1. 匿名註冊取得 token
$auth = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/anonymous" -Method POST -ContentType "application/json" -Body '{"device_fingerprint":"test-device-1"}'
$token = $auth.data.token

# 2. 用 token 發一則心情文
$headers = @{ Authorization = "Bearer $token" }
$body = '{"content":"今天天氣不錯","mood_tag":"peaceful","latitude":22.2,"longitude":113.55,"precision_level":"neighborhood"}'
Invoke-RestMethod -Uri "http://localhost:3000/v1/moods" -Method POST -Headers $headers -ContentType "application/json" -Body $body
