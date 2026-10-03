# Homelab sürümü — yayın talimatı

Bu dal (`homelab`), upstream `v2.10.0` etiketinin üzerine şunları ekler:

1. `fix(ui): add img role to labelled editor plug button icons` — PR dalı: `fix/editor-plug-btn-a11y`
2. `feat(ui/sidebar): follow the locale of the parent page` — PR dalı: `feat/sidebar-locale-passthrough`
3. `chore(release): publish client as @esershnr/artalk 2.10.0-esershnr.1` — yalnızca bu fork'a özel
4. Bu dosya
5. `fix(ui): skip mounting when the instance is destroyed before mount finishes` — PR dalı:
   `fix/mount-after-destroy`
6. `` fix(ui): export the Turkish locale as `artalk/i18n/tr` `` — PR dalı: `fix/i18n-tr-export`
7. `feat(ui/sidebar): load the client locale set of the forced locale` — PR dalı:
   `feat/sidebar-locale-passthrough` (2. maddeyle aynı PR)
8. `chore(release): bump to 2.10.0-esershnr.2` — yalnızca bu fork'a özel

| Ne           | Değer                                         |
| ------------ | --------------------------------------------- |
| Sürüm        | `2.10.0-esershnr.2`                           |
| Docker imajı | `esershnr/artalk:2.10.0-esershnr.2`           |
| npm paketi   | `@esershnr/artalk@2.10.0-esershnr.2`          |
| Taban        | upstream `v2.10.0` (`git describe` ile bakın) |

Değişiklik geçmişi:

- `2.10.0-esershnr.2`
  - `Artalk.init()` sonrası mount bitmeden `destroy()` çağrılınca (React StrictMode, hızlı SPA
    geçişi) eski örnek artık container'a editör/liste eklemiyor; aynı elemana yeniden init
    edildiğinde çift editör, çift liste ve çift yorum görünmüyor.
  - `artalk/i18n/tr` artık çözülüyor (önceden yalnızca `artalk/i18n/tr.mjs`).
  - Sidebar'a `locale` zorlandığında (ör. `tr`) içindeki Artalk istemcisinin dil seti de
    yükleniyor; yorum listesi başlıkları, işlemler ve göreli zamanlar artık İngilizce kalmıyor.
- `2.10.0-esershnr.1`: editör eklenti düğmesi ikonlarına `img` rolü; sidebar üst sayfanın
  `locale`'ini izliyor; istemci `@esershnr/artalk` adıyla yayımlanıyor.

Gereksinimler: Node.js >= 22.19.0, pnpm 10.33.2 (`corepack enable` ya da `npx pnpm@10.33.2`), Docker.

## 0. Hazırlık ve doğrulama

```sh
git fetch origin
git checkout homelab
git reset --hard origin/homelab   # yerel dal uzaktakiyle aynı olsun (yerel değişiklikleri siler)
git status                        # temiz olmalı

pnpm install --frozen-lockfile
pnpm build:all
pnpm test --run
pnpm -F @artalk/artalk-sidebar test
pnpm eslint ui && pnpm prettier --check ui
```

## 1. Docker imajı

Sabit etiket kullanın; `latest` **kullanmayın**.

Temiz bir kopyadan build edin. `.dockerignore` yalnızca kökteki `node_modules`'u dışlar; geliştirme
ağacındaki `ui/*/node_modules` build context'e sızar ve container içindeki UI build'ini bozar
(`Cannot find module .../vite/bin/vite.js`).

```sh
git worktree add --detach ../artalk-release homelab
cd ../artalk-release

VERSION=2.10.0-esershnr.2

docker build \
  --build-arg APP_VERSION="v${VERSION}" \
  --build-arg APP_COMMIT_HASH="$(git rev-parse --short HEAD)" \
  --build-arg TZ=Europe/Istanbul \
  -t "esershnr/artalk:${VERSION}" .

# Çıktı: Artalk (v2.10.0-esershnr.2/<commit>)
# (Windows Git Bash'te komutun başına MSYS_NO_PATHCONV=1 ekleyin)
docker run --rm --entrypoint /artalk "esershnr/artalk:${VERSION}" version

docker login
docker push "esershnr/artalk:${VERSION}"

cd - && git worktree remove ../artalk-release
```

`APP_VERSION` zorunludur. `.git` imaja kopyalanmadığı için verilmezse backend sürümü
`internal/config/version.go` içindeki `v2.10.0` olur. İstemci (`2.10.0-esershnr.2`) ile
backend sürümü eşleşmezse yorum listesinin üstünde "istemciyi güncelleyin" uyarısı çıkar.

`TZ` verilmezse imaj `Asia/Shanghai` saat dilimini kullanır.

Birden çok mimari (örn. ARM tabanlı bir homelab sunucusu) için, yine temiz worktree içinde:

```sh
docker buildx build --platform linux/amd64,linux/arm64 \
  --build-arg APP_VERSION="v${VERSION}" \
  --build-arg APP_COMMIT_HASH="$(git rev-parse --short HEAD)" \
  --build-arg TZ=Europe/Istanbul \
  -t "esershnr/artalk:${VERSION}" --push .
```

Compose dosyasında etiketi sabitleyin (isterseniz digest ile):

```yaml
services:
  artalk:
    image: esershnr/artalk:2.10.0-esershnr.2
```

## 2. npm paketi (`@esershnr/artalk`)

`ui/artalk/package.json` içinde `publishConfig.access` zaten `public`.

```sh
pnpm install --frozen-lockfile
pnpm build                                   # = pnpm -F artalk build (@esershnr/artalk ile eşleşir)

# İçeriği, adı ve sürümü kontrol edin
cd ui/artalk
npm pack --dry-run

npm login
npm view @esershnr/artalk dist-tags          # mevcut etiketler (eski 2.9.3 sürümü varsa "latest" onu gösterir)

npm publish --tag homelab --dry-run
npm publish --tag homelab                    # 2FA varsa: --otp <kod>
```

`--tag` seçenekleri:

- `--tag homelab` (önerilen): `latest` etiketine dokunmaz. Sürüm prerelease olduğu için npm 11
  `--tag` olmadan yayını reddeder (`You must specify a tag using --tag ...`).
- `--tag next`: yaygın alternatif ad; davranışı aynı.
- `latest`'i de bu sürüme taşımak isterseniz yayından sonra:
  `npm dist-tag add @esershnr/artalk@2.10.0-esershnr.2 latest`

Tüketen projede sürümü tam sabitleyin. Alias ile kurarsanız kod `artalk` adıyla import etmeye
devam eder ve resmi pakete dönmek tek satır olur:

```sh
pnpm add artalk@npm:@esershnr/artalk@2.10.0-esershnr.2
```

## 3. Sürüm yükseltme (upstream yeni sürüm çıkarınca)

Örnek: upstream `v2.11.0` yayınladı.

```sh
OLD=2.10.0-esershnr.2
OLD_BASE=v2.10.0   # homelab'in şu anki tabanı
NEW_BASE=v2.11.0
NEW=2.11.0-esershnr.1

git fetch upstream --tags
git fetch origin

# 1) Eski ucu etiketle ve yedekle
git tag "homelab/v${OLD}" origin/homelab
git push origin "homelab/v${OLD}"

# 2) PR'lar upstream'e girdi mi?
git log --oneline "${NEW_BASE}" --grep "img role" --grep "locale of the parent page"   --grep "destroyed before mount finishes" --grep "Turkish locale as"   --grep "client locale set of the forced locale"

# 3) Fork commit'lerini yeni tabana taşı
git checkout homelab
git rebase --onto "${NEW_BASE}" "${OLD_BASE}" homelab
```

Rebase sırasında:

- Upstream'e aynen girmiş bir commit otomatik atlanır. Upstream değiştirerek aldıysa çakışır;
  upstream sürümünü koruyup `git rebase --skip` ile o commit'i atlayın.
- Yayın adı commit'inde `ui/artalk/package.json` çakışırsa upstream'in yeni dosyasını alıp yalnızca
  `name` (`@esershnr/artalk`), `version` (`${NEW}`), `bugs`, `repository.url` ve `publishConfig`
  alanlarını yeniden uygulayın. Diğer `package.json` dosyalarındaki
  `"artalk": "workspace:^"` → `"artalk": "workspace:@esershnr/artalk@^"` değişikliğini de kontrol
  edin; upstream yeni bir tüketici eklediyse ona da uygulayın (`git grep -n '"artalk": "workspace:^"'`
  boş dönmeli). `pnpm -F artalk ...` filtreleri değişmeden çalışır: pnpm benzersiz kapsamlı paketi
  kapsamsız adıyla da eşleştirir.
- `pnpm-lock.yaml` çakışırsa yeni tabanınkini alın (`git checkout "${NEW_BASE}" -- pnpm-lock.yaml`),
  `pnpm install` ile yeniden üretin ve `git add pnpm-lock.yaml` ile devam edin. Not: rebase sırasında
  `--ours` yeni tabanı, `--theirs` yeniden uygulanan kendi commit'inizi gösterir.

Sonra:

```sh
# Sürümü güncelle: ui/artalk/package.json "version", bu dosyadaki tüm sürüm geçişleri,
# tablodaki taban ve OLD_BASE örneği
git grep -n "${OLD}"

pnpm install                 # lockfile'ı güncelle
pnpm install --frozen-lockfile
# 0. adımdaki doğrulamaları çalıştırın, sonra:
git commit -am "chore(release): bump to ${NEW}"

# homelab yeniden yazıldığı için force gerekir (yalnızca bu dal için, yedek etiketi aldıktan sonra)
git push --force-with-lease origin homelab
```

Sonra 1. ve 2. adımlarla `${NEW}` etiketli imajı ve paketi yayınlayın. Upstream sürüm değişmeden
yalnızca fork'ta düzeltme yaparsanız sonek artar: `2.10.0-esershnr.2` → `2.10.0-esershnr.3`.

Force-push istemiyorsanız alternatif: `git merge "${NEW_BASE}"` ile yeni etiketi `homelab`'e birleştirin.
Çakışma çözümü aynıdır, geçmiş daha karışık olur.

## 4. PR'lar merge olunca resmi imaja/pakete geçiş

Dört PR da (`fix/editor-plug-btn-a11y`, `feat/sidebar-locale-passthrough`, `fix/mount-after-destroy`,
`fix/i18n-tr-export`) bir upstream sürümüne girdiğinde (3. bölümdeki `git log --grep` beş commit'in
hepsini gösterdiğinde) fork'a gerek kalmaz:

1. `/data` dizinini yedekleyin.
2. Docker: imajı resmi imajla değiştirin, sabit sürümle:
   `image: artalk/artalk-go:<o-sürüm>` (örn. `2.11.0`). Taban aynı upstream kodu olduğundan veri
   biçimi uyumludur; yine de önce yedek alın.
3. npm: tüketen projede `pnpm add artalk@<o-sürüm>`. Alias kullandıysanız import'lar değişmez;
   kullanmadıysanız `@esershnr/artalk` import'larını (CSS dahil) `artalk` olarak değiştirin.
4. Fork paketini kullanımdan kaldırın (silmeyin):
   `npm deprecate @esershnr/artalk "Use the official artalk package >= <o-sürüm>"`
5. Docker Hub'daki `esershnr/artalk` etiketlerini geri dönüş için bir süre tutun.
6. `homelab` dalını ve `homelab/v*` etiketlerini arşiv olarak bırakın.
