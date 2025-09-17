from .graphql import *

def authorizedScopes(appKey):
    appScopes = GraphQL().run(
            """
            query getScopes($key:String!) {
                appByKey($key) {
                    availableAccessScopes {
                        handle
                    }
                }
            }
            """,
            {
                "key":appKey
            }
        )
    return [x.get("handle") for x in appScopes.search("data.appByKey.availableAccessScopes")]