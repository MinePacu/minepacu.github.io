require 'jekyll'

module Jekyll
  class CodeFilenameProcessor
    def self.post_process_html(content)
      # HTML 주석으로 파일명이 지정된 코드 블록을 찾아 변환
      content.gsub(/<!--\s*filename:\s*([^\s]+)\s*-->\s*<div class="language-(\w+) highlighter-rouge">(.*?)<\/div><\/div>/m) do
        filename = $1
        language = $2
        full_block = $3
        
        # 파일 아이콘 가져오기
        icon = get_file_icon(language)
        
        # 새로운 구조로 래핑
        <<~HTML
          <div class="code-block-with-filename">
            <div class="code-filename">
              <span class="filename-text">#{icon} #{filename}</span>
              <button class="copy-button" title="Copy code">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="language-#{language} highlighter-rouge">#{full_block}</div></div>
          </div>
        HTML
      end
    end
    
    def self.get_file_icon(language)
      icons = {
        'csharp' => '<i class="fas fa-file-code"></i>',
        'javascript' => '<i class="fab fa-js-square"></i>',
        'python' => '<i class="fab fa-python"></i>',
        'java' => '<i class="fab fa-java"></i>',
        'html' => '<i class="fab fa-html5"></i>',
        'css' => '<i class="fab fa-css3-alt"></i>',
        'scss' => '<i class="fab fa-sass"></i>',
        'json' => '<i class="fas fa-file-code"></i>',
        'yaml' => '<i class="fas fa-file-alt"></i>',
        'bash' => '<i class="fas fa-terminal"></i>',
        'shell' => '<i class="fas fa-terminal"></i>',
        'sql' => '<i class="fas fa-database"></i>',
        'php' => '<i class="fab fa-php"></i>',
        'ruby' => '<i class="fas fa-gem"></i>',
        'go' => '<i class="fas fa-file-code"></i>',
        'rust' => '<i class="fas fa-file-code"></i>',
        'cpp' => '<i class="fas fa-file-code"></i>',
        'c' => '<i class="fas fa-file-code"></i>',
        'typescript' => '<i class="fas fa-file-code"></i>',
        'markdown' => '<i class="fab fa-markdown"></i>'
      }
      icons[language] || '<i class="fas fa-file-code"></i>'
    end
  end
end

# Jekyll Hook으로 HTML 후처리
Jekyll::Hooks.register [:posts, :pages], :post_render do |doc|
  doc.output = Jekyll::CodeFilenameProcessor.post_process_html(doc.output)
end