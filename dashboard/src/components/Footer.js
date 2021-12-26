import { Center, Link } from '@chakra-ui/react'

export const Footer = () => { 
  return (
    <Center as="footer" py="8rem">
        by &nbsp;<Link target="_blank" href="https://twitter.com/canu_dao" sx={{fontWeight:'bold'}}>CanuDAO</Link>
    </Center>
  )
}