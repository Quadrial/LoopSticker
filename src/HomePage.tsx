import { useEffect, useState, type FormEvent } from 'react'

function HomePage() {
  const [link, setLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stickerUrl, setStickerUrl] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'error' | 'info'
    text: string
  } | null>(null)

  useEffect(() => {
    if (!stickerUrl) return
    return () => URL.revokeObjectURL(stickerUrl)
  }, [stickerUrl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = link.trim()
    let url: URL

    try {
      url = new URL(value.includes('://') ? value : `https://${value}`)
    } catch {
      setNotice({
        type: 'error',
        text: 'Enter a valid X post link, such as x.com/username/status/123.',
      })
      return
    }

    const allowedHosts = new Set([
      'x.com',
      'www.x.com',
      'twitter.com',
      'www.twitter.com',
      'mobile.twitter.com',
    ])
    const isPostLink =
      /^\/(?:[^/]+\/status|i\/web\/status)\/\d+(?:\/|$)/i.test(url.pathname)

    if (
      url.protocol !== 'https:' ||
      !allowedHosts.has(url.hostname.toLowerCase()) ||
      !isPostLink
    ) {
      setNotice({
        type: 'error',
        text: 'That does not look like an X post link. Paste a link to a post containing a GIF.',
      })
      return
    }

    setIsLoading(true)
    setStickerUrl(null)
    setNotice(null)

    try {
      const response = await fetch('/api/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      })

      if (!response.ok) {
        const error: unknown = await response.json()
        const message =
          error !== null &&
          typeof error === 'object' &&
          'error' in error &&
          typeof error.error === 'string'
            ? error.error
            : 'Could not create a sticker from this post.'
        throw new Error(message)
      }

      if (!response.headers.get('content-type')?.includes('image/webp')) {
        throw new Error('The server returned an unsupported sticker format.')
      }

      const sticker = await response.blob()
      if (sticker.size === 0) {
        throw new Error('The converted sticker was empty.')
      }

      setStickerUrl(URL.createObjectURL(sticker))
      setNotice({
        type: 'info',
        text: 'Your sticker is ready. Download it to add it to WhatsApp.',
      })
    } catch (error) {
      setNotice({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Could not create a sticker. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbf9f6] text-[#20202a]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#" className="flex items-center gap-2.5" aria-label="Loop home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#7256e8] text-white shadow-lg shadow-violet-200/70">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
            >
              <path
                d="M7.5 8.5h8a4 4 0 0 1 0 8h-7a4 4 0 0 1 0-8h1m7 7-2 2m2-2-2-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            loop<span className="text-[#7256e8]">sticker</span>
          </span>
        </a>
        <a
          href="#how-it-works"
          className="rounded-full px-4 py-2 text-sm font-semibold text-[#656473] transition hover:bg-white hover:text-[#7256e8]"
        >
          How it works
        </a>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-24 lg:pt-14">
          <div className="pointer-events-none absolute -left-28 top-16 -z-0 size-72 rounded-full bg-[#ece7ff] opacity-70 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e9e4ff] bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7256e8] shadow-sm">
              <span className="size-2 rounded-full bg-[#ff6f91]" />
              X GIFs, meet WhatsApp
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.045em] text-[#20202a] sm:text-5xl lg:text-[4.25rem]">
              Good GIFs
              <br />
              deserve to be
              <span className="relative ml-2 inline-block text-[#7256e8]">
                stickers.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 12"
                  className="absolute -bottom-2 left-0 w-full"
                  fill="none"
                >
                  <path
                    d="M3 8C54 2 152 1 217 7"
                    stroke="#ffc857"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#777583] sm:text-lg sm:leading-8">
              Paste a link to a GIF on X. We’ll turn it into an animated
              WhatsApp sticker you can take with you.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-9 rounded-3xl border border-[#eeebf1] bg-white p-3 shadow-[0_20px_60px_-32px_rgba(47,37,77,0.28)] sm:p-4"
            >
              <label
                htmlFor="post-link"
                className="mb-2 block px-2 text-sm font-bold text-[#3d3b49]"
              >
                Paste your X post link
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#e9e7ed] bg-[#fbfafc] px-4 transition focus-within:border-[#a99af4] focus-within:ring-4 focus-within:ring-[#7256e8]/10">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-5 shrink-0 text-[#9b99a5]"
                  >
                    <path
                      d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71m2.72 6.36a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    id="post-link"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://x.com/username/status/..."
                    value={link}
                    onChange={(event) => {
                      setLink(event.target.value)
                      setNotice(null)
                    }}
                    className="h-14 min-w-0 flex-1 bg-transparent text-sm text-[#292735] outline-none placeholder:text-[#aaa8b3] sm:text-base"
                    aria-describedby={notice ? 'link-notice' : 'link-help'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#7256e8] px-6 text-sm font-bold text-white shadow-lg shadow-[#7256e8]/20 transition hover:-translate-y-0.5 hover:bg-[#6245dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7256e8] active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoading ? 'Converting…' : 'Create sticker'}
                  {isLoading ? (
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="size-4"
                    >
                      <path
                        d="M4 10h12m0 0-5-5m5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {notice ? (
                <p
                  id="link-notice"
                  role={notice.type === 'error' ? 'alert' : 'status'}
                  className={`px-2 pt-3 text-sm ${
                    notice.type === 'error'
                      ? 'text-rose-600'
                      : 'text-[#6250c2]'
                  }`}
                >
                  {notice.text}
                </p>
              ) : (
                <p id="link-help" className="px-2 pt-3 text-xs text-[#9694a0]">
                  Public X posts only. Media is fetched by a third-party resolver.
                </p>
              )}
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#777583]">
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4 text-[#7256e8]"
                >
                  <path
                    d="m5 10 3.2 3.2L15.5 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                No app to install
              </span>
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4 text-[#7256e8]"
                >
                  <path
                    d="M10 2.5 4 5v4.7c0 3.6 2.6 6.8 6 7.8 3.4-1 6-4.2 6-7.8V5l-6-2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m7.5 9.8 1.7 1.7 3.5-3.7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Made for WhatsApp
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -right-3 top-8 z-10 flex -rotate-6 items-center gap-2 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl shadow-[#44326d]/10 sm:-right-5 sm:top-12">
              <span className="text-xl" aria-hidden="true">
                ✨
              </span>
              <span className="text-xs font-bold text-[#555262]">
                Made to share
              </span>
            </div>
            <div className="absolute -bottom-4 left-2 z-10 flex rotate-3 items-center gap-2 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl shadow-[#44326d]/10 sm:-left-5">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#e5f7ea] text-[#32804a]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                >
                  <path
                    d="M10 3v10m0 0 3.5-3.5M10 13l-3.5-3.5M4 15.5v1h12v-1"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#555262]">
                Ready for WhatsApp
              </span>
            </div>
            <div className="rounded-[2rem] bg-[#eae5ff] p-3 shadow-[0_30px_90px_-40px_rgba(74,54,143,0.45)] sm:rounded-[2.5rem] sm:p-5">
              <div className="overflow-hidden rounded-[1.5rem] bg-white sm:rounded-[2rem]">
                <div className="flex items-center justify-between border-b border-[#f0eef3] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-[#f0edff] text-[#7256e8]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="size-4"
                      >
                        <rect
                          x="2.5"
                          y="3.5"
                          width="15"
                          height="13"
                          rx="2.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx="7"
                          cy="8"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <path
                          d="m4 14 4-3 2.5 2 2.5-3 3 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-bold text-[#33313f]">
                      Your sticker
                    </span>
                  </div>
                  <span className="rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7256e8]">
                    Preview
                  </span>
                </div>
                <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-[#fcfbfe] px-6 py-10 sm:min-h-[380px]">
                  <div className="absolute left-8 top-10 size-16 rounded-full bg-[#fff0d6] blur-2xl" />
                  <div className="absolute bottom-8 right-7 size-24 rounded-full bg-[#e6e1ff] blur-2xl" />
                  {stickerUrl ? (
                    <div className="relative flex flex-col items-center">
                      <div className="flex size-52 items-center justify-center rounded-[2.75rem] bg-white p-3 shadow-[0_18px_45px_-30px_rgba(84,62,151,0.35)] sm:size-60">
                        <img
                          src={stickerUrl}
                          alt="Converted animated WhatsApp sticker"
                          className="size-full object-contain"
                        />
                      </div>
                      <a
                        href={stickerUrl}
                        download="whatsapp-sticker.webp"
                        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7256e8] px-5 text-sm font-bold text-white shadow-lg shadow-[#7256e8]/20 transition hover:bg-[#6245dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7256e8]"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="size-4"
                        >
                          <path
                            d="M10 3v10m0 0 3.5-3.5M10 13l-3.5-3.5M4 15.5v1h12v-1"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Download sticker
                      </a>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center">
                      <div className="relative flex size-44 items-center justify-center rounded-[2.75rem] border-2 border-dashed border-[#d9d2fa] bg-white shadow-[0_18px_45px_-30px_rgba(84,62,151,0.35)] sm:size-52">
                        <div className="absolute -right-3 top-5 flex size-12 rotate-12 items-center justify-center rounded-2xl bg-[#ffd567] text-2xl shadow-md shadow-amber-200/60">
                          <span aria-hidden="true">✦</span>
                        </div>
                        <div className="absolute -bottom-3 -left-3 flex size-12 -rotate-12 items-center justify-center rounded-2xl bg-[#ff8c9f] text-2xl shadow-md shadow-rose-200/60">
                          <span aria-hidden="true">♥</span>
                        </div>
                        <div className="flex size-32 flex-col items-center justify-center rounded-[2rem] bg-[#f1edff] text-center sm:size-36">
                          <span className="text-5xl" aria-hidden="true">
                            GIF
                          </span>
                          <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b7bd6]">
                            to sticker
                          </span>
                        </div>
                      </div>
                      <p className="mt-8 text-sm font-bold text-[#53515f]">
                        Your GIF will appear here
                      </p>
                      <p className="mt-1 text-xs text-[#9997a2]">
                        Paste a post link to get started
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#f0eef3] px-5 py-4 sm:px-6">
                  <span className="text-xs font-semibold text-[#777583]">
                    Animated sticker
                  </span>
                  <span className="rounded-lg bg-[#f6f5f8] px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide text-[#777583]">
                    WEBP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-[#efedf1] bg-white/70"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
            <div className="mx-auto mb-9 max-w-xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8c7bd8]">
                Three little steps
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-[#292735] sm:text-3xl">
                From scroll to sticker
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  number: '01',
                  title: 'Copy an X link',
                  description: 'Find a public post with a GIF and copy its link.',
                  color: 'bg-[#f0edff] text-[#7256e8]',
                },
                {
                  number: '02',
                  title: 'Make it a sticker',
                  description: 'We’ll convert the GIF into an animated sticker.',
                  color: 'bg-[#fff4dc] text-[#bf8411]',
                },
                {
                  number: '03',
                  title: 'Add to WhatsApp',
                  description: 'Download your sticker and add it to your chats.',
                  color: 'bg-[#e7f7eb] text-[#348250]',
                },
              ].map((step) => (
                <article
                  key={step.number}
                  className="rounded-3xl border border-[#efedf1] bg-white p-6 sm:p-7"
                >
                  <span
                    className={`flex size-11 items-center justify-center rounded-2xl text-sm font-black ${step.color}`}
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-base font-extrabold text-[#33313f]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#85838f]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-7 text-center text-xs leading-5 text-[#9997a2]">
              Public X posts only. Adding stickers to WhatsApp may require an
              import step on your device.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[#9997a2] sm:flex-row sm:px-8 lg:px-12">
        <span className="font-bold text-[#656371]">loopsticker</span>
        <span>Good GIFs make great stickers.</span>
      </footer>
    </div>
  )
}

export default HomePage
