import type { NextPage } from 'next'
import { getSession, signIn, signOut, useSession } from 'next-auth/react'
import {useEffect, useRef, useState} from 'react'
import {lightOrDark} from '../lib/color'
import {useRouter} from 'next/router'

const Home: NextPage = ({ data: _data }) => {
  const { data: session }               = useSession()
  const router                          = useRouter()
  const errorDialogRef                  = useRef()
  const [data, setData]                 = useState(_data)
  const [error, setError]               = useState()
  const [searchState, setSearchState]   = useState('ready')
  const [approveState, setApproveState] = useState('ready')
  const [mergeState, setMergeState]     = useState('ready')

  useEffect(() => { setData(_data) }, [_data])

  const refresh = () => router.replace(router.asPath)
  const checkboxIndeterminate = !data.search.edges.every(e => e.node.selected) && !data.search.edges.every(e => !e.node.selected)
  const handleSearch = async (e) => {
    setSearchState('loading')
    e.preventDefault()
    await router.replace(`/?q=${encodeURIComponent(e.target.querySelector('input').value)}`)
    setSearchState('ready')
  }
  const handleApproveSelected = async () => {
    setApproveState('loading')
    const { errors } = await approveSelected(session, data)
    if (errors) { setError(errors); errorDialogRef.current.showModal() }
    await refresh()
    setApproveState('ready')
  }
  const handleMergeSelected = async () => {
    setMergeState('loading')
    const { errors } = await mergeSelected(session, data)
    if (errors) { setError(errors); errorDialogRef.current.showModal() }
    await refresh()
    setMergeState('ready')
  }

  const STATE_SYMBOLS = {
    'OPEN': 'O',
    'MERGED': 'M',
    'CLOSED': 'C'
  }
  const REVIEW_DECISION_SYMBOLS = {
    'REVIEW_REQUIRED':   '⚠️',
    'CHANGES_REQUESTED': '🛑',
    'APPROVED':          '✅',
    'NO_REVIEW':         '⛔️'
  }
  const COMMIT_STATUS = {
    'ERROR':    '❌',
    'EXPECTED': '?',
    'FAILURE':  '❌',
    'PENDING':  '⏱',
    'SUCCESS':  '✅',
    'N/A':      '?',
  }

  if (!session) {
    return <button onClick={() => signIn()}>Sign in</button>
  }

  console.log(data)

  return (
    <div>
      <button onClick={() => signOut()}>Sign out</button>
      <main style={{margin: '0 auto', maxWidth: '1024px'}}>

        <dialog ref={errorDialogRef}>
          <h3>Error!</h3>
          <pre
            style={{maxHeight: '300px', maxWidth: '600px', overflow: 'scroll'}}
          >{JSON.stringify(error, null, '    ')}</pre>
          <button onClick={() => errorDialogRef.current.close()}>Close</button>
        </dialog>

        <form onSubmit={handleSearch}>
          <input
            type="text"
            style={{width: '32rem'}}
            placeholder="Search..."
            defaultValue={router.query.q}
          />
          <button disabled={searchState==='loading'}>
            {searchState === 'ready' && 'Search'}
            {searchState === 'loading' && 'Loading...'}
          </button>
        </form>

        <br />

        <div style={{
          display:'grid',
          gridTemplateAreas: "'a b c d e f'",
          gridTemplateColumns: '30px 30px 30px 30px 30px auto',
          alignItems: 'end',
        }}>
          <div style={{gridArea: 'a / a / a / c'}}>
            <input
              type="checkbox"
              ref={el => { el && (el.indeterminate = checkboxIndeterminate); } }
              onChange={toggleSelectAll.bind(null, data, setData)}
            />
          </div>
          <div style={{gridArea: 'b', writingMode: 'sideways-lr'}}>State</div>
          <div style={{gridArea: 'c', writingMode: 'sideways-lr'}}>Reviews</div>
          <div style={{gridArea: 'd', writingMode: 'sideways-lr'}}>Checks</div>
          <div style={{gridArea: 'e', writingMode: 'sideways-lr'}}>Merged</div>
          <div style={{gridArea: 'f'}}>
            <button onClick={handleApproveSelected} disabled={approveState==='loading'}>
              {approveState === 'ready' && 'Approve'}
              {approveState === 'loading' && 'Loading...'}
            </button>
            &nbsp;
            <button onClick={handleMergeSelected} disabled={mergeState==='loading'}>
              {mergeState === 'ready' && 'Merge'}
              {mergeState === 'loading' && 'Loading...'}
            </button>
          </div>
        </div>

        <hr />

        <style>{`
          .search-items:nth-child(even) {
            background-color: #eee;
          }
        `}</style>
        {data?.search?.edges && data.search.edges.map(({ node: pr }) => (
          <div key={pr.id} className="search-items" style={{
            display:'grid',
            gridTemplateAreas: "'a b c d e f'",
            gridTemplateColumns: '30px 30px 30px 30px 30px auto',
            padding: '5px',
          }}>
            <div style={{gridArea: 'a'}}>
              <input
                type="checkbox"
                checked={pr.state === 'OPEN' && pr.selected}
                disabled={pr.state !== 'OPEN'}
                onChange={() => {
                  pr.selected = !pr.selected;
                  setData({...data});
                }}
              />
            </div>

            <div style={{gridArea: 'b'}} title={pr.state}>{STATE_SYMBOLS[pr.state]}</div>
            <div style={{gridArea: 'c'}} title={pr.reviewDecision ?? 'NO_REVIEW'}>{REVIEW_DECISION_SYMBOLS[pr.reviewDecision ?? 'NO_REVIEW']}</div>
            <div style={{gridArea: 'd'}} title={pr.commits.nodes[0].commit.statusCheckRollup?.state}>{COMMIT_STATUS[pr.commits.nodes[0].commit.statusCheckRollup?.state]}</div>
            <div style={{gridArea: 'e'}} title={pr.mergeCommit?.statusCheckRollup?.state ?? 'N/A'}>{COMMIT_STATUS[pr.mergeCommit?.statusCheckRollup?.state ?? 'N/A']}</div>

            <div style={{gridArea: 'f'}}>
              <div>{pr.title}</div>
              <div style={{fontSize: '0.8rem'}}>
                <a href={pr.url}>
                  {pr.url.replace('https://github.com/', '')}
                </a>
                {pr.labels.nodes.map(l => (
                  <span key={l.id} style={{
                    backgroundColor: '#'+l.color,
                    color:           lightOrDark('#'+l.color)==='dark'?'#fff':'#000',
                    border:          '1px solid #bbb',
                    borderRadius:    '3px',
                    padding:         '0 0.25rem',
                    margin:          '0 0.25rem'
                    }}>{l.name}</span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {data?.search?.pageInfo?.hasNextPage && (
          <a href={`/?q=${encodeURIComponent(router.query.q)}&after=${data.search.edges[data.search.edges.length - 1].cursor}`}>
            Next Page
          </a>
        )}
      </main>
    </div>
  )
}

async function toggleSelectAll (data, setData, e) {
  const selected = e.target.checked
  data.search.edges.filter(e => e.node.state === 'OPEN').forEach(p => { p.node.selected = selected })
  setData({ ...data })
}

async function approveSelected (session, data) {
  if (!data?.search.edges) return

  const parts = data.search.edges.map(e => e.node).filter(n => n.selected).map((pr, k) => 
    `idx${k}: addPullRequestReview(input: {pullRequestId: "${pr.id}", event: APPROVE}) { clientMutationId }`
  )

  if (!window.confirm(`You are about to approve ${parts.length} PRs. Are you sure?`)) return

  const gql = `mutation ApprovePrs {
    ${parts.join('\n')}
  }`

  const res = await fetch('https://api.github.com/graphql', {
    headers: { authorization: `Basic ${btoa(':'+session.accessToken)}` },
    method: 'POST',
    body: JSON.stringify({ query: gql })
  })
  return await res.json()
}

async function mergeSelected (session, data) {
  if (!data?.search.edges) return

  const parts = data.search.edges.map(e => e.node).filter(n => n.selected).map((pr, k) => 
    `idx${k}: mergePullRequest(input: {pullRequestId: "${pr.id}", mergeMethod: SQUASH}) { clientMutationId }`
  )

  if (!window.confirm(`You are about to merge ${parts.length} PRs. Are you sure?`)) return

  const gql = `mutation MergePrs {
    ${parts.join('\n')}
  }`

  const res = await fetch('https://api.github.com/graphql', {
    headers: { authorization: `Basic ${btoa(':'+session.accessToken)}` },
    method: 'POST',
    body: JSON.stringify({ query: gql })
  })
  return await res.json()
}

export async function getServerSideProps(context) {
  let session = await getSession(context)
  if (!session) return {
    redirect: {
      destination: `/api/auth/signin?callbackUrl=${new URL(context.req.url, process.env.NEXTAUTH_URL).toString()}`,
      permanent: false
    }
  }

  let pagination = ''
  if (context.query.after) pagination = `, after: "${context.query.after}"`
  if (context.query.before) pagination = `, before: "${context.query.before}"`
  let q = 'is:pr '
  if (context.query.q) q += context.query.q

  const gql = `{
    search(query: "${q}", type: ISSUE, first: 100${pagination}) {
      edges {
        cursor
        node {
          ... on PullRequest {
            id
            reviewDecision
            title
            url
            state
            labels(first: 10) {
              nodes {
                color
                name
                id
              }
            }
            mergeCommit {
              commitUrl
              statusCheckRollup {
                state
              }
            }
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    state
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }`
  const res = await fetch('https://api.github.com/graphql', {
    headers: { authorization: `Basic ${btoa(':'+session.accessToken)}` },
    method: 'POST',
    body: JSON.stringify({ query: gql })
  })
  const json = await res.json()
  return { props: json }
}


export default Home
