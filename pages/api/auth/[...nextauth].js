import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

export default NextAuth({
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // console.log({user,account,profile,email,credentials})
      return true
    },
    async session({ session, token, user, ...rest }) {
      // Send properties to the client, like an access_token from a provider.
      // console.log(token)
      // console.log(rest)
      session.accessToken = token.accessToken
      return session
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      // console.log(account)
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    }
  },
  providers: [
    GithubProvider({
      authorization: "https://github.com/login/oauth/authorize?scope=admin:org+read:user+user:email+repo",
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
})
