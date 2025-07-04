# Korumalı Rotalar (Protected Routes)

Bu belge, uygulamada korumalı rotaların (protected routes) nasıl kullanılacağını açıklar.

## Genel Bakış

Korumalı rotalar, sadece kimlik doğrulaması yapılmış (giriş yapmış) kullanıcıların erişebileceği sayfalardır. Bu sayfalar, kullanıcı giriş yapmamışsa otomatik olarak giriş sayfasına yönlendirilirler.

## Kullanım

### 1. ProtectedRoute Bileşeni ile Kullanım

`ProtectedRoute` bileşeni, React Router'ın Route yapısı içinde kullanılarak sayfalara erişimi kısıtlar.

```tsx
// App.tsx içinde kullanım örneği
<Routes>
  {/* Herkes erişebilir */}
  <Route path="/giris" element={<Login />} />
  <Route path="/kayit" element={<Register />} />
  <Route path="/" element={<Home />} />

  {/* Sadece giriş yapmış kullanıcılar erişebilir */}
  <Route element={<ProtectedRoute />}>
    <Route path="/profil" element={<Profile />} />
    <Route path="/arkadaslar" element={<Friends />} />
  </Route>
</Routes>
```

### 2. useProtectedRoute Hook'u ile Kullanım

`useProtectedRoute` hook'u, bileşenlerin içinde doğrudan kullanılabilir. Bu hook, kullanıcı giriş yapmamışsa otomatik olarak giriş sayfasına yönlendirir.

```tsx
// Herhangi bir sayfada kullanım örneği
const ProtectedPage = () => {
  // Bu hook, sayfa yüklendiğinde giriş durumunu kontrol eder
  useProtectedRoute();

  return (
    <div>
      Bu içerik sadece giriş yapmış kullanıcılar için görüntülenir.
    </div>
  );
};
```

## Yönlendirme Mantığı

Kullanıcı korumalı bir sayfaya giriş yapmadan erişmeye çalıştığında:

1. Kullanıcı giriş sayfasına yönlendirilir
2. Kullanıcının erişmeye çalıştığı sayfa URL'i, `location.state` içinde saklanır
3. Kullanıcı başarılı bir şekilde giriş yaptıktan sonra, önceki erişmeye çalıştığı sayfaya yönlendirilir

## Kodların Çalışma Mantığı

1. **ProtectedRoute Bileşeni**:
   - `useAuth` hook'u ile kimlik doğrulama durumunu kontrol eder
   - Kullanıcı giriş yapmamışsa, `Navigate` bileşeni ile giriş sayfasına yönlendirir
   - Kullanıcı giriş yapmışsa, `Outlet` bileşeni ile alt rotaları render eder

2. **useProtectedRoute Hook'u**:
   - `useAuth` hook'u ile kimlik doğrulama durumunu kontrol eder
   - `useEffect` içinde, kullanıcı giriş yapmamışsa, `navigate` fonksiyonu ile giriş sayfasına yönlendirir
   - Kullanıcının erişmeye çalıştığı sayfa URL'i, yönlendirme sırasında `state` olarak saklanır 