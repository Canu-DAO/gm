import {
  Text,
  VStack,
  Heading,
  Button,
  Link as ChakraLink,
  Container
} from '@chakra-ui/react'
import { Main } from '../components/Main'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Footer } from '../components/Footer'

const Index = () => (
  <Container>
    <Main>
    <VStack spacing={5} justifyContent="center" alignItems="center">
      <Heading fontSize="8vw" color="gray">
        gm bot
      </Heading>
      <Text fontSize="10vw">☀️</Text>
      <ChakraLink href="https://discord.com/api/oauth2/authorize?client_id=893356893865644083&permissions=85056&scope=bot"><Button>Add to Discord</Button></ChakraLink>
      <ChakraLink href="/dashboard"><Button>See Dashboard</Button></ChakraLink>
    </VStack>
    </Main>

    <DarkModeSwitch />
    <Footer />
  </Container>
)

export default Index
