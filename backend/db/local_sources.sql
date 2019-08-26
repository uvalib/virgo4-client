TRUNCATE TABLE sources restart identity;
INSERT INTO sources(name,private_url) values 
   ('catalog', 'https://pool-solr-ws-catalog-dev.internal.lib.virginia.edu'),
   ('video', 'https://pool-solr-ws-video-dev.internal.lib.virginia.edu'),
   ('archival', 'https://pool-solr-ws-archival-dev.internal.lib.virginia.edu'),
   ('serials', 'https://pool-solr-ws-serials-dev.internal.lib.virginia.edu'),
   ('sound-recordings', 'https://pool-solr-ws-sound-recordings-dev.internal.lib.virginia.edu'),
   ('musical-scores', 'https://pool-solr-ws-musical-scores-dev.internal.lib.virginia.edu'),
   ('music-recordings', 'https://pool-solr-ws-music-recordings-dev.internal.lib.virginia.edu'),
   ('articles', 'https://pool-eds-ws-dev.internal.lib.virginia.edu');
