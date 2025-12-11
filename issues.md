- strong type getSections with the following data response. make sure the next request can use the `next` field correctly. 
```
{
  offset: 0,
  limit: 250,
  size: 250,
  _links: {
    next: '/api/v2/get_sections/16&suite_id=142&limit=250&offset=250',
    prev: null
  },
  sections: [
    {
      id: 41419,
      suite_id: 142,
      name: 'MSX',
      description: null,
      parent_id: null,
      display_order: 1,
      depth: 0
    },
    {
      id: 42802,
      suite_id: 142,
      name: 'EMA - Meeting ingestion (rule)',
      description: null,
      parent_id: 41419,
      display_order: 2,
      depth: 1
    },
    ... 150 more items
  ]
}
```

- check the API documentation pages carefully and make sure all APIs are strong typed and all `next` links from the response can be requested correctly. Add tests for `next` link for all APIs in folder src/scripts.

- [Projects API](https://support.testrail.com/hc/en-us/articles/7077792415124-Projects)
- [Suites API](https://support.testrail.com/hc/en-us/articles/7077936624276-Suites)
- [Sections API](https://support.testrail.com/hc/en-us/articles/7077918603412-Sections)
- [Cases API](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases)
- [Groups API](https://support.testrail.com/hc/en-us/articles/7077338821012-Groups)
- [Users API](https://support.testrail.com/hc/en-us/articles/7077978310292-Users)
- [Priorities API](https://support.testrail.com/hc/en-us/articles/7077746564244-Priorities)