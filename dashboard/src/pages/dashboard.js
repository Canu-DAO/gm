import {
  Link as ChakraLink,
  Center,
  VStack,
  Heading,
  Container
} from '@chakra-ui/react'
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from '@chakra-ui/react'
import { Main } from '../components/Main'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Footer } from '../components/Footer'
import { mongoConnect } from '../lib/mongo';

export default function Dashboard({ guilds }) { 

  return(
    <Container>
      <Main>
      <Center pt={50}>
        <VStack spacing={8} justifyContent="center" alignItems="center">
          <Heading fontSize="3em" color="gray">
            dashboard
          </Heading>
          <Table size='lg'>
            <Thead>
            <Tr>
              <Th>server name</Th>
              <Th>total gm's</Th>
            </Tr>
          </Thead>
          <Tbody>
            { guilds.map((guild) => (
              <Tr>
                <Td>{ guild.name }</Td>
                <Td>{ guild.total }</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        </VStack>
      </Center>
      </Main>
      <DarkModeSwitch />
      <Footer>
      </Footer>
    </Container>
  )
}

export async function getServerSideProps(context) {
  try {
    const client = await mongoConnect();
    const collections = await client.db('gm').listCollections().toArray();
    let guilds = [];
    for (let i = 0; i < collections.length; i++) {
      const key = collections[i].name;
      if (key.indexOf('-dev') < 0) {
        const guildDoc = await client.db('gm').collection(key).findOne({'channelId': { $exists: true }});
        const totalDoc = await client.db('gm').collection(key).find({'history': { $exists: true }}, { projection: { _id: 0, history:1 }}).toArray();
        const total = totalDoc.map( (a) => {
          return a.history.length;
        }).reduce((sum,val) => {
          return sum+val
        });

        guilds.push({name: guildDoc.guildName, total: total});
      } else { continue };
    } 
    return {
      props: { guilds: guilds },
    }
  } catch (e) {
    console.error(e)
    return {
      props: { isConnected: false },
    }
  }
}