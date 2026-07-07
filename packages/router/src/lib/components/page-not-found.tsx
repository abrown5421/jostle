import NavigationLink from './navigation-link';
import { Box, Button, Text } from '@inithium/ui';
import React from 'react';

const PageNotFound: React.FC = () => {
    return (
        <Box flex align="center" justify="center" fullWidth fullHeight className="h-screen">
            <Box color='surface' flex direction="col" align="center" padding='xl' className='rounded-xl'>
                <Text variant="h1" color='danger'>
                    404
                </Text>
                <Box margin='lg'>
                    <Text variant="body2" color='danger'>
                        We're sorry the page you are looking for could not be found.
                    </Text>
                </Box>
                <Button color='danger'>
                    <NavigationLink pageKey="home">Go home</NavigationLink>
                </Button>
            </Box>
        </Box>
    )
};

export default PageNotFound;
export { PageNotFound };