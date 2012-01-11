require 'rubygems'
require 'rack'
require 'rack/contrib'

use Rack::JSONP

root=Dir.pwd
puts ">>> Serving: #{root}/../"
run Rack::Directory.new("#{root}/../")