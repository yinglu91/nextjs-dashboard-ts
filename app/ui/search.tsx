'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

type Props = { placeholder: string }

export default function Search({ placeholder }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname() // '/dashboard/invoices'
  const { replace } = useRouter()

  const handleSearch2 = (term: string) => {
    console.log(`Searching... ${term}`)

    const params = new URLSearchParams(searchParams)
    // URLSearchParams - Web API use to get params string like 'page=1&query=a'

    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }

    replace(`${pathname}?${params.toString()}`)
    // the URL is updated to /dashboard/invoices?query=lee if input: lee
  }

  const handleSearch = useDebouncedCallback(handleSearch2, 600)
  // only run the code after a specific time once the user has stopped typing (300ms).
  // By debouncing, you can reduce the number of requests sent to your database, thus saving resources.

  return (
    <div className='relative flex flex-1 flex-shrink-0'>
      <label
        htmlFor='search'
        className='sr-only'
      >
        Search
      </label>

      <input
        className='peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500'
        placeholder={placeholder}
        onChange={(event) => handleSearch(event.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />

      <MagnifyingGlassIcon className='absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900' />
    </div>
  )
}
