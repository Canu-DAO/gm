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
    <VStack spacing={8} justifyContent="center" alignItems="center">
      <Heading fontSize="10vw" color="gray">
        gm bot
      </Heading>
      <Text fontSize="10vw">☀️</Text>
      <Button>Add to Discord</Button>
      <ChakraLink href="/dashboard"><Button>See Dashboard</Button></ChakraLink>
    </VStack>
    </Main>

    <DarkModeSwitch />
    <Footer>
    </Footer>
  </Container>
)

export default Index
